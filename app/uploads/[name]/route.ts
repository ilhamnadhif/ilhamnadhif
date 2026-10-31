import { readUpload } from "@/lib/uploads";

/**
 * Serves files uploaded from the dashboard. They live in DATA_DIR, not in
 * public/, because public/ is only read at build time.
 */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[name]">) {
  const { name } = await params;
  const file = await readUpload(name);
  if (!file) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": file.type,
    "Content-Length": String(file.body.length),
    // Names are random and never reused, so the content of a URL never changes.
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (file.type === "image/svg+xml") {
    // Stops scripts inside an uploaded SVG from running if it is opened directly.
    // Not applied to PDFs: browsers refuse to run their PDF viewer in a sandboxed document.
    headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
  }

  return new Response(new Uint8Array(file.body), { headers });
}
