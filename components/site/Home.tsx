/* eslint-disable @next/next/no-img-element -- uploads are small, already-sized files served from the data volume */
import { ArrowRight, ArrowUpRight, Award, BriefcaseBusiness, FileDown, FileText, GraduationCap, Mail } from "lucide-react";
import { Fragment } from "react";
import { projectSlug, type Content, type Project } from "@/lib/content/schema";
import { dictionary, formatPeriod, t, type Locale } from "@/lib/i18n";
import { MediaViewer } from "./MediaViewer";
import { GitHubMark, icons } from "./icons";
import { RichText, splitTags } from "./RichText";

type Props = { content: Content; lang: Locale };

export function Home({ content, lang }: Props) {
  const { links } = content;
  const dict = dictionary[lang];

  return (
    <main className="page" id="top">
      <Hero content={content} lang={lang} />

      <hr />

      <About content={content} lang={lang} />

      <hr />

      <section id="work">
        <h2 className="chapter">{dict.work}</h2>
        <ul className="icon-list timeline">
          {content.work.map((job) => (
            <li key={job.id}>
              <Logo src={job.logo} fallback={<BriefcaseBusiness className="icon" aria-hidden />} />
              <div>
                <p className="title">
                  {job.url ? (
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      {job.company}
                    </a>
                  ) : (
                    job.company
                  )}{" "}
                  &mdash; {t(job.role, lang)}
                </p>
                <p className="meta">
                  {[formatPeriod(job.start, job.end, lang), t(job.location, lang)].filter(Boolean).join(" · ")}
                </p>
                <RichText text={t(job.description, lang)} />
              </div>
            </li>
          ))}
        </ul>
        {links.linkedin && (
          <p className="extra">
            {dict.fullHistory}{" "}
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            .
          </p>
        )}
      </section>

      {content.projects.length > 0 && (
        <>
          <hr />
          <section id="projects">
            <h2 className="chapter">{dict.projects}</h2>
            <ul className="icon-list">
              {content.projects.map((project) => {
                const Icon = icons[project.icon];
                const tags = splitTags(project.tags);
                const tagline = t(project.tagline, lang);
                const href = `/${lang}/projects/${projectSlug(project)}`;
                const cover = project.screenshots[0];
                return (
                  <li key={project.id}>
                    <Logo src={project.logo} fallback={<Icon className="icon" aria-hidden />} />
                    <div>
                      <p className="title">
                        <a href={href}>{project.name}</a>
                        {tagline && <> &mdash; {tagline}</>}
                      </p>
                      <RichText text={t(project.description, lang)} />
                      {cover && (
                        <a href={href} className="project-cover" aria-label={`${dict.details}: ${project.name}`}>
                          <img src={cover.file} alt={t(cover.caption, lang)} loading="lazy" />
                        </a>
                      )}
                      {tags.length > 0 && (
                        <div className="tags">
                          {tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="item-actions">
                        <a href={href} className="btn btn-secondary btn-small">
                          {dict.details}
                          <ArrowRight aria-hidden />
                        </a>
                        <ProjectLinks project={project} lang={lang} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {(content.education.length > 0 || content.certifications.length > 0) && <hr />}

      {content.education.length > 0 && (
        <section id="education">
          <h2 className="chapter">{dict.education}</h2>
          <ul className="icon-list timeline">
            {content.education.map((school) => (
              <li key={school.id}>
                <Logo src={school.logo} fallback={<GraduationCap className="icon" aria-hidden />} />
                <div>
                  <p className="title">{school.school}</p>
                  <p className="meta">{formatPeriod(school.start, school.end, lang)}</p>
                  <p>{t(school.degree, lang)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.certifications.length > 0 && (
        <section id="certifications">
          <h2 className="chapter">{dict.certifications}</h2>
          <ul className="icon-list timeline">
            {content.certifications.map((cert) => {
              const name = t(cert.name, lang);
              const period = formatPeriod(cert.start, cert.end, lang);
              return (
                <li key={cert.id}>
                  <Logo src={cert.logo} fallback={<Award className="icon" aria-hidden />} />
                  <div>
                    <p className="title">
                      {cert.issuer}
                      {name && <> &mdash; {name}</>}
                    </p>
                    {period && <p className="meta">{period}</p>}
                    <RichText text={t(cert.description, lang)} />
                    {(cert.files.length > 0 || cert.url) && (
                      <div className="item-actions">
                        {cert.files.map((item) => {
                          const label = t(item.label, lang) || dict.viewCertificate;
                          return (
                            <MediaViewer
                              key={item.id}
                              file={item.file}
                              title={`${[cert.issuer, name].filter(Boolean).join(" — ")} · ${label}`}
                              className="btn btn-secondary btn-small"
                              labels={{ openInNewTab: dict.openInNewTab, close: dict.close }}
                            >
                              <FileText aria-hidden />
                              {label}
                            </MediaViewer>
                          );
                        })}
                        {cert.url && (
                          <a href={cert.url} className="btn btn-secondary btn-small" target="_blank" rel="noopener noreferrer">
                            <ArrowUpRight aria-hidden />
                            {dict.verify}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <hr />

      <SiteFooter content={content} lang={lang} />
    </main>
  );
}

function Hero({ content, lang }: Props) {
  const { profile, links } = content;
  const dict = dictionary[lang];
  return (
    <header className="hero">
      <a href={`/${lang}`} className="avatar" aria-label={profile.name}>
        {profile.avatar ? <img src={profile.avatar} alt="" width={96} height={96} /> : profile.initials}
      </a>
      <h1>{t(profile.headline, lang)}</h1>
      <p className="subtitle">{t(profile.subtitle, lang)}</p>
      <div className="hero-actions">
        {profile.email && (
          <a href={`mailto:${profile.email}`} className="btn btn-primary">
            <Mail aria-hidden />
            {dict.emailMe}
          </a>
        )}
        {links.github && (
          <a href={links.github} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
            <GitHubMark />
            GitHub
          </a>
        )}
        {profile.cv && (
          <a href={profile.cv} className="btn btn-secondary" download={`CV ${profile.name}.pdf`}>
            <FileDown aria-hidden />
            {dict.downloadCv}
          </a>
        )}
      </div>
    </header>
  );
}

function About({ content, lang }: Props) {
  const [first, ...rest] = content.about;
  const [firstQuote, ...otherQuotes] = content.testimonials;

  const block = (item: Content["about"][number], index: number) => {
    const tags = splitTags(t(item.tags, lang));
    return (
      <section key={item.id} id={index === 0 ? "about" : item.id}>
        <h2 className="chapter">{t(item.title, lang)}</h2>
        <RichText text={t(item.body, lang)} />
        {tags.length > 0 && (
          <div className="tags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </section>
    );
  };

  const quote = (item: Content["testimonials"][number]) => (
    <blockquote key={item.id}>
      &ldquo;{t(item.quote, lang)}&rdquo;
      <cite>
        {item.author}
        {t(item.role, lang) && <> &mdash; {t(item.role, lang)}</>}
      </cite>
    </blockquote>
  );

  // Same rhythm as the reference layout: first block, a quote, the remaining blocks, then the other quotes.
  return (
    <>
      {first && block(first, 0)}
      {firstQuote && quote(firstQuote)}
      {rest.map((item, i) => (
        <Fragment key={item.id}>{block(item, i + 1)}</Fragment>
      ))}
      {otherQuotes.map(quote)}
    </>
  );
}

/** Shared with the project pages. */
export function SiteFooter({ content, lang }: Props) {
  const { profile, links } = content;
  const dict = dictionary[lang];
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-links">
        <a href={`/${lang}`}>{dict.nav.home}</a>
        {links.linkedin && (
          <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        )}
        {links.github && (
          <a href={links.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        )}
        {profile.email && <a href={`mailto:${profile.email}`}>Email</a>}
      </div>
      <a href="#top" className="monogram" aria-label={dict.backToTop}>
        {profile.initials}
      </a>
    </footer>
  );
}

/** Repository and download buttons, used on the home page and the project page. */
export function ProjectLinks({ project, lang }: { project: Project; lang: Locale }) {
  const onGitHub = project.repo.includes("github.com");
  return (
    <>
      {project.repo && (
        <a href={project.repo} className="btn btn-secondary btn-small" target="_blank" rel="noopener noreferrer">
          {onGitHub ? <GitHubMark /> : <ArrowUpRight aria-hidden />}
          {onGitHub ? "GitHub" : "Source"}
        </a>
      )}
      {project.homepage && (
        <a href={project.homepage} className="btn btn-secondary btn-small" target="_blank" rel="noopener noreferrer">
          <ArrowUpRight aria-hidden />
          {t(project.homepageLabel, lang) || "Website"}
        </a>
      )}
    </>
  );
}

export function Logo({ src, fallback }: { src: string; fallback: React.ReactNode }) {
  return src ? <img src={src} alt="" className="icon" width={24} height={24} /> : fallback;
}
