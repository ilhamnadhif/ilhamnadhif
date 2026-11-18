import type { Metadata } from "next";
import { franklin } from "@/lib/fonts";
import { pagePath } from "@/lib/site";
import { themeScript } from "@/lib/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Page not found",
  robots: { index: false },
};

/** Exported as 404.html, which GitHub Pages serves for every unknown address. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={franklin.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <main className="page">
          <header className="hero">
            <h1>404</h1>
            <p className="subtitle">
              This page does not exist.{" "}
              <span lang="id">Halaman ini tidak ada.</span>
            </p>
            <div className="hero-actions">
              <a href={pagePath("en")} className="btn btn-primary" hrefLang="en">
                Home
              </a>
              <a href={pagePath("id")} className="btn btn-secondary" hrefLang="id" lang="id">
                Beranda
              </a>
            </div>
          </header>
        </main>
      </body>
    </html>
  );
}
