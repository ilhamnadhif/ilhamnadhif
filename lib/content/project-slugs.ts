import fs from "node:fs/promises";
import { CONTENT_FILE } from "./paths";
import { projectSlug } from "./schema";

let cache: { mtimeMs: number; slugs: Set<string> } | null = null;

/**
 * The project slugs in the content file, re-read only when the file changes.
 * Proxy uses this to answer unknown project URLs with a real 404: the page can
 * only call notFound() after streaming has started, which keeps a 200 status.
 * Returns null when the file is missing or unreadable, so the page decides.
 */
export async function projectSlugs(): Promise<Set<string> | null> {
  try {
    const { mtimeMs } = await fs.stat(CONTENT_FILE);
    if (cache?.mtimeMs === mtimeMs) return cache.slugs;
    const content = JSON.parse(await fs.readFile(CONTENT_FILE, "utf8")) as {
      projects?: { slug?: string; id: string }[];
    };
    const slugs = new Set((content.projects ?? []).map((project) => projectSlug({ slug: project.slug ?? "", id: project.id })));
    cache = { mtimeMs, slugs };
    return slugs;
  } catch {
    return null;
  }
}
