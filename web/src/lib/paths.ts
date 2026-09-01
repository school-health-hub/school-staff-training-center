const DEFAULT_BASE_PATH = "/school-staff-training-center";
const DEFAULT_SITE_URL = "https://school-health-hub.github.io/school-staff-training-center/";

export function getBasePath() {
  const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || DEFAULT_BASE_PATH;
  const normalized = configuredBasePath.trim().replace(/\/+$/, "");

  return normalized === "/" ? "" : normalized;
}

export function getAssetPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBasePath()}${normalizedPath}`;
}

export function getSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const normalized = configuredSiteUrl.trim().replace(/\/+$/, "");

  return `${normalized}/`;
}

export function getSiteOrigin() {
  return new URL(getSiteUrl()).origin;
}

export function getSiteAssetUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, getSiteUrl()).toString();
}
