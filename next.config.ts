import type { NextConfig } from "next";
import { MAX_UPLOAD_BYTES } from "./lib/upload-limit";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // The upload action enforces the real cap; 1MB more leaves room for multipart overhead.
      bodySizeLimit: MAX_UPLOAD_BYTES + 1024 * 1024,
    },
  },
};

export default nextConfig;
