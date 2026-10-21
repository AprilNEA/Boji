import type { NextConfig } from "next";
import path from "node:path";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
  // The docs content lives in ../docs/, outside this package. Turbopack does not
  // resolve files outside its root, and it detects websites/ as the root from
  // pnpm-lock.yaml. Next.js also uses this value for outputFileTracingRoot.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
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

// Compiles the MDX files in ../docs/ for src/lib/source.ts.
const withMDX = createMDX();

export default withMDX(nextConfig);
