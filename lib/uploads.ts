import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "./content/store";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "./upload-limit";

export const uploadTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
} as const;

type Extension = keyof typeof uploadTypes;

const STORED_NAME = /^[a-z0-9-]+\.(png|jpe?g|webp|svg|pdf)$/;

/** Checks the first bytes, so a renamed file of another type is rejected. */
function matchesSignature(ext: Extension, bytes: Buffer): boolean {
  const head = bytes.subarray(0, 12);
  switch (ext) {
    case "png":
      return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "jpg":
    case "jpeg":
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case "webp":
      return head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP";
    case "pdf":
      return head.toString("ascii", 0, 5) === "%PDF-";
    case "svg": {
      const start = bytes.subarray(0, 1024).toString("utf8").trimStart().toLowerCase();
      return start.startsWith("<svg") || start.startsWith("<?xml");
    }
  }
}

export type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function storeUpload(file: File, allowed: readonly Extension[]): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, error: "File kosong." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `Ukuran file maksimal ${MAX_UPLOAD_MB}MB.` };

  const ext = file.name.split(".").pop()?.toLowerCase() as Extension | undefined;
  if (!ext || !allowed.includes(ext)) {
    return { ok: false, error: `Format yang diizinkan: ${allowed.join(", ")}.` };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(ext, bytes)) return { ok: false, error: "Isi file tidak cocok dengan formatnya." };

  const name = `${randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name), bytes);
  return { ok: true, path: `/uploads/${name}` };
}

export async function readUpload(name: string) {
  if (!STORED_NAME.test(name)) return null;
  try {
    const body = await fs.readFile(path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name));
    const ext = name.split(".").pop() as Extension;
    return { body, type: uploadTypes[ext] };
  } catch {
    return null;
  }
}
