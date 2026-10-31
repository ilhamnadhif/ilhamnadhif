import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Uploads are capped at 5MB in the action itself; leave room for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
