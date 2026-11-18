import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Home } from "@/components/site/Home";
import { Nav } from "@/components/site/Nav";
import { getContent } from "@/lib/content/store";
import { hasLocale, t } from "@/lib/i18n";
import { SITE_URL, alternates, pagePath } from "@/lib/site";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const content = getContent();
  const { profile, links } = content;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: `${SITE_URL}${pagePath(lang)}`,
    jobTitle: t(profile.headline, lang),
    description: t(profile.subtitle, lang),
    address: t(profile.location, lang) || undefined,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    sameAs: [links.linkedin, links.github].filter(Boolean),
  };

  return (
    <>
      <Nav lang={lang} />
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
  const { seo, profile } = getContent();
  const title = t(seo.title, lang);
  const description = t(seo.description, lang);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: alternates(lang),
    openGraph: {
      type: "profile",
      title,
      description,
      url: pagePath(lang),
      siteName: profile.name,
      locale: lang === "id" ? "id_ID" : "en_US",
      ...(profile.avatar && { images: [{ url: profile.avatar }] }),
    },
    twitter: { card: "summary", title, description },
  };
}
