import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    // The site and the docs have separate root layouts, so the 404 page is src/app/global-not-found.tsx.
    globalNotFound: true,
  },
  // Dev-only: hosts that may load dev chunks and HMR. Add LAN or proxy hosts
  // here when you open the dev server from another origin.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
  ],
};

// Compiles the MDX files in content/docs/ for src/lib/source.ts.
const withMDX = createMDX();

export default withMDX(nextConfig);
