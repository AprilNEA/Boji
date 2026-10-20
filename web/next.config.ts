import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
  // Cloud Preview reaches the dev server through proxy hosts; without this,
  // Next.js 16 blocks its dev chunks/HMR and the page never hydrates.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.manus.computer",
    "*.sg2.manus.computer",
    "*.manus.im",
    "*.manus.space",
    "*.manuspre.computer",
    "*.manus-asia.computer",
  ],
};

export default nextConfig;
