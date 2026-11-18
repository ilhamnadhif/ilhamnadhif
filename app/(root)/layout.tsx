import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { franklin } from "@/lib/fonts";
import { defaultLocale } from "@/lib/i18n";
import { SITE_URL, alternates, pagePath } from "@/lib/site";
import { themeScript } from "@/lib/theme-script";
import "../globals.css";

const { seo } = getContent();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: seo.title.en,
  description: seo.description.en,
  alternates: { ...alternates(defaultLocale), languages: { ...alternates(defaultLocale).languages, "x-default": "/" } },
};

/** The bare address only picks a language; see page.tsx. */
export default function LanguagePickerLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale} className={franklin.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Without JavaScript, go to the default language. */}
        <noscript>
          <meta httpEquiv="refresh" content={`0; url=${pagePath(defaultLocale)}`} />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
