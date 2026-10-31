import { franklin } from "@/lib/fonts";
import { defaultLocale, hasLocale, locales } from "@/lib/i18n";
import { themeScript } from "@/lib/theme-script";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;

  return (
    // Unknown languages get a 404 from the page; data-theme is set by the inline script before hydration.
    <html
      lang={hasLocale(lang) ? lang : defaultLocale}
      className={franklin.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8f6f2" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1d1c1a" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
