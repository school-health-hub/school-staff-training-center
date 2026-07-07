import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "/school-staff-training-center";
const normalizedBasePath = configuredBasePath.trim().replace(/\/+$/, "");
const basePath = normalizedBasePath === "/" ? "" : normalizedBasePath;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath,
  assetPrefix: basePath || undefined,
  turbopack: {
    root: appRoot
  }
};

export default nextConfig;
