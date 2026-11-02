export const locales = ["en", "id"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** A piece of content that exists in every supported language. */
export type Localized = Record<Locale, string>;

/** Picks the requested language, falling back to the other one when it is empty. */
export function t(value: Localized, lang: Locale): string {
  return value[lang]?.trim() ? value[lang] : value[lang === "en" ? "id" : "en"];
}

/** Fixed interface text. Everything a visitor reads that is not content lives here. */
export const dictionary = {
  en: {
    nav: { home: "Home", about: "About", work: "Work", projects: "Projects" },
    switchLanguage: "Baca dalam Bahasa Indonesia",
    toggleTheme: "Toggle theme",
    emailMe: "Email me",
    downloadCv: "Download CV",
    work: "Work",
    projects: "Projects",
    details: "Details",
    allProjects: "All projects",
    screenshots: "Screenshots",
    education: "Education",
    certifications: "Bootcamps & Certifications",
    viewCertificate: "View certificate",
    verify: "Verify",
    openInNewTab: "Open in new tab",
    close: "Close",
    present: "Present",
    fullHistory: "Full work history on",
    backToTop: "Back to top",
  },
  id: {
    nav: { home: "Beranda", about: "Tentang", work: "Pengalaman", projects: "Proyek" },
    switchLanguage: "Read in English",
    toggleTheme: "Ganti tema",
    emailMe: "Kirim email",
    downloadCv: "Unduh CV",
    work: "Pengalaman",
    projects: "Proyek",
    details: "Detail",
    allProjects: "Semua proyek",
    screenshots: "Tangkapan layar",
    education: "Pendidikan",
    certifications: "Bootcamp & Sertifikasi",
    viewCertificate: "Lihat sertifikat",
    verify: "Verifikasi",
    openInNewTab: "Buka di tab baru",
    close: "Tutup",
    present: "Sekarang",
    fullHistory: "Riwayat kerja lengkap di",
    backToTop: "Kembali ke atas",
  },
} satisfies Record<Locale, unknown>;

export type Dictionary = (typeof dictionary)[Locale];

const intlLocale: Record<Locale, string> = { en: "en-US", id: "id-ID" };

/** Formats "2022", "2022-08" or "" (ongoing) for display. Both empty gives "". */
export function formatPeriod(start: string, end: string, lang: Locale): string {
  if (!start && !end) return "";
  const format = (value: string) => {
    const [year, month] = value.split("-").map(Number);
    if (!month) return String(year);
    return new Intl.DateTimeFormat(intlLocale[lang], {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  };
  const from = start ? format(start) : "";
  const to = end ? format(end) : dictionary[lang].present;
  if (!from) return to;
  return from === to ? from : `${from} – ${to}`;
}
