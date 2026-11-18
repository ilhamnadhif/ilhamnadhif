import { defaultLocale, locales } from "@/lib/i18n";
import { pagePath } from "@/lib/site";

/**
 * GitHub Pages cannot read Accept-Language, so the browser picks: the first
 * language in navigator.languages that the site has, otherwise English.
 */
const redirect = `(() => {
  const supported = ${JSON.stringify(locales)};
  const wanted = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language])
    .map((tag) => String(tag).toLowerCase().split("-")[0]);
  const lang = wanted.find((code) => supported.includes(code)) || ${JSON.stringify(defaultLocale)};
  location.replace("/" + lang + "/" + location.hash);
})();`;

export default function LanguagePicker() {
  return (
    <main className="page">
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <div className="hero-actions">
        <a href={pagePath("en")} className="btn btn-secondary" hrefLang="en" lang="en">
          English
        </a>
        <a href={pagePath("id")} className="btn btn-secondary" hrefLang="id" lang="id">
          Bahasa Indonesia
        </a>
      </div>
    </main>
  );
}
