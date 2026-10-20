import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
  // Dev-only: hosts that may load dev chunks and HMR. Add LAN or proxy hosts
  // here when you open the dev server from another origin.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
  ],
};

export default nextConfig;
