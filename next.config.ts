import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A static site in out/, published to GitHub Pages by .github/workflows/ci.yml.
  output: "export",
  // Every page becomes a folder with an index.html, which GitHub Pages serves as is.
  trailingSlash: true,
  experimental: {
    // The site has two root layouts (/[lang] and the language picker at /), so the
    // 404 page cannot come from either of them.
    globalNotFound: true,
  },
};

export default nextConfig;
