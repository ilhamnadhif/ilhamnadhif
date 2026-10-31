import { dictionary, type Locale } from "@/lib/i18n";
import { ThemeToggle } from "./ThemeToggle";

/** Static: it only depends on the language, so it is part of the prerendered shell. */
/** `path` is the current page without the language, so the switch keeps it. */
export function Nav({ lang, path = "" }: { lang: Locale; path?: string }) {
  const dict = dictionary[lang];
  const other: Locale = lang === "en" ? "id" : "en";
  return (
    <nav className="site-nav" aria-label="Page navigation">
      <a href={`/${lang}`} className="nav-home">
        {dict.nav.home}
      </a>
      <a href={`/${lang}#about`}>{dict.nav.about}</a>
      <a href={`/${lang}#work`}>{dict.nav.work}</a>
      <a href={`/${lang}#projects`}>{dict.nav.projects}</a>
      <a className="lang-switch" href={`/${other}${path}`} hrefLang={other} lang={other} aria-label={dict.switchLanguage}>
        {other.toUpperCase()}
      </a>
      <ThemeToggle label={dict.toggleTheme} />
    </nav>
  );
}
