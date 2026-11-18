/* eslint-disable @next/next/no-img-element -- screenshots are already-sized WebP files */
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo, ProjectLinks, SiteFooter } from "@/components/site/Home";
import { icons } from "@/components/site/icons";
import { MediaViewer } from "@/components/site/MediaViewer";
import { Nav } from "@/components/site/Nav";
import { RichText, splitTags } from "@/components/site/RichText";
import { projectSlug, type Project } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";
import { dictionary, hasLocale, t, type Locale } from "@/lib/i18n";
import { SITE_URL, alternates, pagePath } from "@/lib/site";

type Params = PageProps<"/[lang]/projects/[slug]">["params"];

/** One page per project in each language, generated at build time. */
export function generateStaticParams() {
  return getContent().projects.map((project) => ({ slug: projectSlug(project) }));
}

// A slug that is not in the content is the 404 page.
export const dynamicParams = false;

async function findProject(params: Params) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return null;
  const content = getContent();
  const project = content.projects.find((item) => projectSlug(item) === slug);
  return project ? { lang, slug, content, project } : null;
}

export default async function ProjectPage({ params }: PageProps<"/[lang]/projects/[slug]">) {
  const found = await findProject(params);
  if (!found) notFound();
  const { lang, slug, content, project } = found;
  const dict = dictionary[lang];
  const Icon = icons[project.icon];
  const tagline = t(project.tagline, lang);
  const tags = splitTags(project.tags);
  const [cover, ...more] = project.screenshots;
  const viewerLabels = { openInNewTab: dict.openInNewTab, close: dict.close };

  return (
    <>
      <Nav lang={lang} path={`/projects/${slug}`} />
      <main className="page project-page" id="top">
        <a href={`${pagePath(lang)}#projects`} className="back-link">
          <ArrowLeft aria-hidden />
          {dict.allProjects}
        </a>

        <header className="hero">
          <div className="project-heading">
            <Logo src={project.logo} fallback={<Icon className="icon" aria-hidden />} />
            <h1>{project.name}</h1>
          </div>
          {tagline && <p className="subtitle">{tagline}</p>}
          <div className="hero-actions">
            <ProjectLinks project={project} lang={lang} />
          </div>
        </header>

        {cover && <Screenshot shot={cover} lang={lang} labels={viewerLabels} eager />}

        <section className="project-body">
          <RichText text={t(project.details, lang) || t(project.description, lang)} />
          {tags.length > 0 && (
            <div className="tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </section>

        {more.length > 0 && (
          <>
            <hr />
            <section id="screenshots">
              <h2 className="chapter">{dict.screenshots}</h2>
              {more.map((shot) => (
                <Screenshot key={shot.id} shot={shot} lang={lang} labels={viewerLabels} />
              ))}
            </section>
          </>
        )}

        <hr />
        <SiteFooter content={content} lang={lang} />
      </main>
    </>
  );
}

function Screenshot({
  shot,
  lang,
  labels,
  eager = false,
}: {
  shot: Project["screenshots"][number];
  lang: Locale;
  labels: { openInNewTab: string; close: string };
  eager?: boolean;
}) {
  const caption = t(shot.caption, lang);
  return (
    <figure className="shot">
      <MediaViewer file={shot.file} title={caption} className="shot-link" labels={labels}>
        <img src={shot.file} alt={caption} loading={eager ? "eager" : "lazy"} />
      </MediaViewer>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projects/[slug]">): Promise<Metadata> {
  const found = await findProject(params);
  if (!found) return {};
  const { lang, slug, content, project } = found;
  const tagline = t(project.tagline, lang);
  const title = `${project.name}${tagline ? ` — ${tagline}` : ""} | ${content.profile.name}`;
  const description = t(project.description, lang);
  const cover = project.screenshots[0];

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: alternates(lang, `/projects/${slug}`),
    openGraph: {
      type: "article",
      title,
      description,
      url: pagePath(lang, `/projects/${slug}`),
      siteName: content.profile.name,
      ...(cover && { images: [{ url: cover.file }] }),
    },
    twitter: { card: cover ? "summary_large_image" : "summary", title, description },
  };
}
