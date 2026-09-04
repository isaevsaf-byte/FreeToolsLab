import type { NextConfig } from "next";

// Static export: the site is plain files on static hosting.
// Tools (tools/<slug>/index.html) and shared/ are copied into out/ by scripts/build.mjs.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  turbopack: { root: process.cwd() },
};

export default nextConfig;
