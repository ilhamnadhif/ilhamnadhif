import { z } from "zod";

const text = (max = 4000) => z.string().trim().max(max);

const localized = (max = 4000) => z.object({ en: text(max), id: text(max) });

/** Path to a file in the upload store, or "" when nothing is set. */
const upload = z
  .string()
  .regex(/^(|\/uploads\/[a-z0-9-]+\.(png|jpe?g|webp|svg|pdf))$/, "Invalid upload path");

const link = z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(500)]);

/** "2022", "2022-08", or "" (which means ongoing for an end date). */
const period = z.string().regex(/^(|\d{4}(-(0[1-9]|1[0-2]))?)$/, "Use YYYY or YYYY-MM");

const id = z.string().min(1).max(64);

export const iconNames = [
  "workflow",
  "shield-check",
  "boxes",
  "plug",
  "notebook-pen",
  "sprout",
  "route",
  "server",
  "database",
  "code",
  "lightbulb",
  "target",
  "users",
  "zap",
  "layers",
  "git-branch",
  "network",
  "book-open",
  "terminal",
  "send",
  "app-window",
  "folder-git",
  "package",
  "globe",
] as const;

export const contentSchema = z.object({
  profile: z.object({
    name: text(120).min(1),
    initials: text(3),
    avatar: upload,
    headline: localized(160),
    subtitle: localized(600),
    location: localized(120),
    email: z.union([z.literal(""), z.email().max(200)]),
    cv: upload,
  }),
  links: z.object({
    linkedin: link,
    github: link,
  }),
  about: z
    .array(
      z.object({
        id,
        title: localized(80),
        body: localized(),
        tags: localized(600),
      }),
    )
    .max(12),
  testimonials: z
    .array(
      z.object({
        id,
        quote: localized(1000),
        author: text(120),
        role: localized(160),
      }),
    )
    .max(12),
  work: z
    .array(
      z.object({
        id,
        company: text(120).min(1),
        role: localized(120),
        start: period,
        end: period,
        location: localized(120),
        description: localized(1500),
        logo: upload,
        url: link,
      }),
    )
    .max(30),
  projects: z
    .array(
      z.object({
        id,
        name: text(80).min(1),
        tagline: localized(160),
        description: localized(1500),
        tags: text(600),
        icon: z.enum(iconNames),
        logo: upload,
        repo: link,
        homepage: link,
        homepageLabel: localized(40),
        /** URL of the detail page: /en/projects/<slug>. Empty falls back to the id. */
        slug: z.string().regex(/^[a-z0-9-]*$/, "Slug: huruf kecil, angka dan tanda minus saja").max(60).default(""),
        /** Longer write-up for the detail page. Supports "- " bullet lists. */
        details: localized(8000).default({ en: "", id: "" }),
        /** The first screenshot is the cover on the home page and the detail page. */
        screenshots: z
          .array(z.object({ id, file: upload, caption: localized(200) }))
          .max(12)
          .default([]),
      }),
    )
    .max(20)
    .refine((items) => new Set(items.map(projectSlug)).size === items.length, "Slug proyek tidak boleh sama")
    // Content files written before this section existed stay valid.
    .default([]),
  education: z
    .array(
      z.object({
        id,
        school: text(160).min(1),
        degree: localized(200),
        start: period,
        end: period,
        logo: upload,
      }),
    )
    .max(20),
  certifications: z
    .array(
      z.object({
        id,
        name: localized(160),
        issuer: text(120).min(1),
        start: period,
        end: period,
        description: localized(1000),
        /** Certificate, transcript, report…: PDFs or images, each opened in a viewer. */
        files: z
          .array(z.object({ id, label: localized(60), file: upload }))
          .max(6)
          .default([]),
        /** Optional verification page from the issuer. */
        url: link,
        logo: upload,
      }),
    )
    .max(30)
    .default([]),
  seo: z.object({
    title: localized(120),
    description: localized(300),
  }),
});

export type Content = z.infer<typeof contentSchema>;
export type Project = Content["projects"][number];

export function projectSlug(project: { slug: string; id: string }) {
  return project.slug || project.id;
}
export type IconName = (typeof iconNames)[number];
