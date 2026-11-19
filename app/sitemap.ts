import type { MetadataRoute } from "next";
import { projectSlug } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";
import { locales } from "@/lib/i18n";
import { SITE_URL, pagePath } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const { projects } = getContent();
  const paths = ["", ...projects.map((project) => `/projects/${projectSlug(project)}`)];
  const pages = paths.flatMap((path) =>
    locales.map((lang) => ({
      url: `${SITE_URL}${pagePath(lang, path)}`,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}${pagePath(l, path)}`])),
      },
    })),
  );
  // A project's own site on this host (its repository's GitHub Pages, /ternarycode/): search
  // engines find it through this sitemap too. Sites elsewhere are not this sitemap's to list.
  const sites = [...new Set(projects.map((project) => project.homepage).filter((url) => url.startsWith(`${SITE_URL}/`)))];
  return [...pages, ...sites.map((url) => ({ url }))];
}
