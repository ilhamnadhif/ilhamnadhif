import "server-only";

import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { CONTENT_FILE, DATA_DIR, UPLOADS_DIR } from "./paths";
import { contentSchema, type Content } from "./schema";

export { DATA_DIR, UPLOADS_DIR };
const BACKUPS_DIR = path.join(DATA_DIR, "backups");
const SEED_FILE = path.join(process.cwd(), "seed", "content.json");
const SEED_UPLOADS_DIR = path.join(process.cwd(), "seed", "uploads");
const MAX_BACKUPS = 10;
const BACKUP_NAME = /^content-\d{8}T\d{6}Z-[a-z0-9]{6}\.json$/;

let cache: { mtimeMs: number; content: Content } | null = null;
let seedUploadsCopied: Promise<void> | null = null;

/**
 * Images referenced by the seed content (certificates, screenshots) ship in
 * seed/uploads. Copies the ones missing from the upload store; files already
 * there are never overwritten.
 */
async function copySeedUploads() {
  const names = await fs.readdir(SEED_UPLOADS_DIR).catch(() => [] as string[]);
  if (names.length === 0) return;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await Promise.all(
    names.map((name) =>
      fs
        .copyFile(path.join(SEED_UPLOADS_DIR, name), path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name), constants.COPYFILE_EXCL)
        .catch((error) => {
          if (error?.code !== "EEXIST") throw error;
        }),
    ),
  );
}

async function ensureContentFile() {
  // Once per process (e.g. after a deploy that adds seed images), and again below whenever the content is re-seeded.
  seedUploadsCopied ??= copySeedUploads();
  await seedUploadsCopied;
  try {
    await fs.access(CONTENT_FILE, constants.F_OK);
  } catch {
    await copySeedUploads();
    await fs.mkdir(DATA_DIR, { recursive: true });
    // COPYFILE_EXCL: never overwrite a file another request created in the meantime.
    await fs.copyFile(SEED_FILE, CONTENT_FILE, constants.COPYFILE_EXCL).catch((error) => {
      if (error?.code !== "EEXIST") throw error;
    });
  }
}

/**
 * Reads the site content. The parsed result is kept in memory until the file
 * changes on disk, so a request costs one `stat` call.
 */
export async function getContent(): Promise<Content> {
  await ensureContentFile();
  const { mtimeMs } = await fs.stat(CONTENT_FILE);
  if (cache?.mtimeMs === mtimeMs) return cache.content;

  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  const content = contentSchema.parse(JSON.parse(raw));
  cache = { mtimeMs, content };
  return content;
}

export type SaveResult = { ok: true } | { ok: false; errors: string[] };

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

/** Validates, backs up the current file, then replaces it atomically. */
export async function saveContent(input: unknown): Promise<SaveResult> {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "content"}: ${issue.message}`),
    };
  }

  await ensureContentFile();
  await fs.mkdir(BACKUPS_DIR, { recursive: true });
  const backupName = `content-${timestamp()}-${randomUUID().slice(0, 6)}.json`;
  await fs.copyFile(CONTENT_FILE, path.join(BACKUPS_DIR, backupName));
  await pruneBackups();

  const tmp = `${CONTENT_FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(parsed.data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, CONTENT_FILE);
  cache = null;
  return { ok: true };
}

export async function listBackups(): Promise<string[]> {
  try {
    const names = await fs.readdir(BACKUPS_DIR);
    return names.filter((name) => BACKUP_NAME.test(name)).sort().reverse();
  } catch {
    return [];
  }
}

async function pruneBackups() {
  const backups = await listBackups();
  await Promise.all(backups.slice(MAX_BACKUPS).map((name) => fs.rm(path.join(BACKUPS_DIR, name))));
}

/** Restores a backup. The content it replaces is backed up first, so a restore can be undone. */
export async function restoreBackup(name: string): Promise<SaveResult> {
  if (!BACKUP_NAME.test(name)) return { ok: false, errors: ["Unknown backup"] };
  try {
    const raw = await fs.readFile(path.join(BACKUPS_DIR, name), "utf8");
    return await saveContent(JSON.parse(raw));
  } catch {
    return { ok: false, errors: ["Backup could not be read"] };
  }
}
