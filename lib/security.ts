/**
 * Input validation + SVG escaping + security helpers.
 */

export function validateUsername(username: string): boolean {
  if (!username || typeof username !== "string") return false;
  if (username.length < 1 || username.length > 39) return false;
  // GitHub rules: alphanumeric + hyphens, no double hyphens, no leading/trailing hyphens
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) return false;
  if (username.includes("--")) return false;
  return true;
}

/**
 * Escape characters that are special in SVG/XML.
 * Prevents SVG injection via username in badge endpoint.
 */
export function escapeSvg(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Security headers for all API responses.
 * Prevents clickjacking, MIME sniffing, and unwanted framing of badge SVGs.
 */
export function securityHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "X-Content-Type-Options":            "nosniff",
    "X-Frame-Options":                   "DENY",
    "X-XSS-Protection":                  "1; mode=block",
    "Referrer-Policy":                   "strict-origin-when-cross-origin",
    "Permissions-Policy":                "camera=(), microphone=(), geolocation=()",
    "Access-Control-Allow-Origin":       process.env.NEXT_PUBLIC_APP_URL ?? "*",
    "Access-Control-Allow-Methods":      "GET",
    ...extra,
  };
}

/**
 * Trim and validate query string length to prevent header-size attacks.
 */
export function safeQueryParam(searchParams: URLSearchParams, key: string, maxLen = 100): string | null {
  const val = searchParams.get(key);
  if (!val) return null;
  if (val.length > maxLen) return null;
  return val.trim();
}
