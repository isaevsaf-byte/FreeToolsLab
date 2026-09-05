import path from "node:path";
import type { NextConfig } from "next";

// Static export: the site is plain files. scripts/build.mjs adds tools/* and shared/* into site/out/.
// Turbopack root is the repo root so the site can import ../shared and ../tools.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  turbopack: { root: path.resolve(process.cwd(), "..") },
};

export default nextConfig;
