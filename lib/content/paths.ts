import path from "node:path";

// Runtime data, not source: excluded from build-time file tracing on purpose.
// Kept apart from store.ts (server-only) so Proxy can read the content file too.
export const DATA_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "data"),
);
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const CONTENT_FILE = path.join(DATA_DIR, "content.json");
