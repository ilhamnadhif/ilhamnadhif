import { locales, type Locale } from "./i18n";

/** Where the site is published (GitHub Pages). Used for canonical URLs and the sitemap. */
export const SITE_URL = "https://ilhamnadhif.github.io";

/**
 * Path of a page in one language, e.g. pagePath("id", "/projects/x") gives "/id/projects/x/".
 * Every page is a folder with an index.html, so paths end with a slash.
 */
export function pagePath(lang: Locale, path = ""): string {
  return `/${lang}${path}/`;
}

/** Canonical URL and the other language's version, for page metadata. */
export function alternates(lang: Locale, path = "") {
  return {
    canonical: pagePath(lang, path),
    languages: Object.fromEntries(locales.map((l) => [l, pagePath(l, path)])),
  };
}
