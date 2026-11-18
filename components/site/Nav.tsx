import { dictionary, type Locale } from "@/lib/i18n";
import { pagePath } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

/** `path` is the current page without the language, so the switch keeps it. */
export function Nav({ lang, path = "" }: { lang: Locale; path?: string }) {
  const dict = dictionary[lang];
  const other: Locale = lang === "en" ? "id" : "en";
  const home = pagePath(lang);
  return (
    <nav className="site-nav" aria-label="Page navigation">
      <a href={home} className="nav-home">
        {dict.nav.home}
      </a>
      <a href={`${home}#about`}>{dict.nav.about}</a>
      <a href={`${home}#work`}>{dict.nav.work}</a>
      <a href={`${home}#projects`}>{dict.nav.projects}</a>
      <a className="lang-switch" href={pagePath(other, path)} hrefLang={other} lang={other} aria-label={dict.switchLanguage}>
        {other.toUpperCase()}
      </a>
      <ThemeToggle label={dict.toggleTheme} />
    </nav>
  );
}
