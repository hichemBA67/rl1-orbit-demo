import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo-name>/. NEXT_PUBLIC_BASE_PATH is set
// by the deploy workflow; locally it is empty so `npm run dev` works at "/".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
