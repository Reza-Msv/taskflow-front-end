/**
 * Validates and sanitizes a redirect URL to prevent open redirect vulnerabilities.
 * Ensures the destination is strictly internal to the application.
 */
export function getSafeRedirectPath(
  rawRedirect: string | null | undefined,
  locale: string = "en",
  fallbackPath: string = "/projects"
): string {
  const fallback = fallbackPath.startsWith("/")
    ? `/${locale}${fallbackPath}`
    : `/${locale}/${fallbackPath}`;

  if (!rawRedirect || typeof rawRedirect !== "string") {
    return fallback;
  }

  const trimmed = rawRedirect.trim();
  if (!trimmed) {
    return fallback;
  }

  // Prevent protocol-relative URLs (e.g. //evil.com, /\\evil.com)
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\")
  ) {
    return fallback;
  }

  // Must begin with a single slash
  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  // Extract path component before query/hash to check for protocol schemes like javascript:
  const pathPart = trimmed.split(/[?#]/)[0];
  if (pathPart.includes(":") || pathPart.includes("\\")) {
    return fallback;
  }

  // If path already has locale prefix (e.g. /en/... or /fa/...)
  if (trimmed === `/${locale}` || trimmed.startsWith(`/${locale}/`)) {
    return trimmed;
  }

  // If path has another supported locale prefix (e.g. /fa/projects while locale is en)
  if (/^\/(en|fa)(\/|$)/.test(trimmed)) {
    return trimmed;
  }

  // Prepend current locale
  return `/${locale}${trimmed}`;
}
