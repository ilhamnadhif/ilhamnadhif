import { NextResponse, type NextRequest } from "next/server";
import { projectSlugs } from "@/lib/content/project-slugs";
import { defaultLocale, hasLocale, type Locale } from "@/lib/i18n";

// Kept in sync with SESSION_COOKIE in lib/auth.ts (that module is server-only).
const SESSION_COOKIE = "admin_session";

/** Picks the visitor's language from Accept-Language, e.g. "id-ID,id;q=0.9,en;q=0.8". */
function preferredLocale(header: string | null): Locale {
  const ranked = (header ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...rest] = part.trim().split(";");
      const q = rest.find((p) => p.trim().startsWith("q="));
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((entry) => entry.lang && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);
  return ranked.find((entry) => hasLocale(entry.lang))?.lang as Locale | undefined ?? defaultLocale;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  const project = url.pathname.match(/^\/([^/]+)\/projects\/([^/]+)$/);
  if (project) {
    const slugs = await projectSlugs();
    if (!slugs || (hasLocale(project[1]) && slugs.has(project[2]))) return NextResponse.next();
    // An unknown project: rewrite to a path no route matches, which renders the
    // site's 404 page with a 404 status instead of a streamed "soft" 404.
    url.pathname = `${url.pathname}/missing`;
    return NextResponse.rewrite(url);
  }

  if (url.pathname === "/admin") {
    // Optimistic check only: the page and every Server Action verify the session
    // signature themselves. Non-GET requests (Server Actions) pass through.
    if (request.method !== "GET" || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url, 307);
  }

  url.pathname = `/${preferredLocale(request.headers.get("accept-language"))}`;
  const response = NextResponse.redirect(url, 307);
  response.headers.set("Vary", "Accept-Language");
  return response;
}

export const config = {
  // The bare root needs a language; every other page already has one in its path.
  matcher: ["/", "/admin", "/:lang/projects/:slug"],
};
