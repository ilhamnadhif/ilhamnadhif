import type { MetadataRoute } from "next";
import { projectSlug } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";
import { locales } from "@/lib/i18n";
import { SITE_URL, pagePath } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", ...getContent().projects.map((project) => `/projects/${projectSlug(project)}`)];
  return paths.flatMap((path) =>
    locales.map((lang) => ({
      url: `${SITE_URL}${pagePath(lang, path)}`,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}${pagePath(l, path)}`])),
      },
    })),
  );
}
