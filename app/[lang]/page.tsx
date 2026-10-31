import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Home } from "@/components/site/Home";
import { Nav } from "@/components/site/Nav";
import { getContent } from "@/lib/content/store";
import { hasLocale, locales, t, type Locale } from "@/lib/i18n";

/**
 * Content lives in a JSON file that the dashboard edits at runtime, so it is
 * read on every request (from an in-memory copy that refreshes when the file
 * changes). The nav does not depend on it and ships in the prerendered shell.
 */
export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <>
      <Nav lang={lang} />
      <Suspense>
        <Content lang={lang} />
      </Suspense>
    </>
  );
}

async function Content({ lang }: { lang: Locale }) {
  await connection();
  const content = await getContent();
  const { profile, links } = content;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: t(profile.headline, lang),
    description: t(profile.subtitle, lang),
    address: t(profile.location, lang) || undefined,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    sameAs: [links.linkedin, links.github].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Home content={content} lang={lang} />
    </>
  );
}

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  await connection();
  const { seo, profile } = await getContent();
  const title = t(seo.title, lang);
  const description = t(seo.description, lang);
  const siteUrl = process.env.SITE_URL;

  return {
    ...(siteUrl && { metadataBase: new URL(siteUrl) }),
    title,
    description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: "profile",
      title,
      description,
      url: `/${lang}`,
      siteName: profile.name,
      locale: lang === "id" ? "id_ID" : "en_US",
      ...(profile.avatar && { images: [{ url: profile.avatar }] }),
    },
    twitter: { card: "summary", title, description },
  };
}
