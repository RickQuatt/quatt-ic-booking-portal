/**
 * Security headers applied to every response by the global middleware.
 *
 * Why each header:
 *   CSP                       prevents XSS by whitelisting script/style/connect origins
 *   Strict-Transport-Security forces HTTPS for 1 year incl. subdomains
 *   X-Frame-Options DENY      blocks clickjacking via iframes
 *   X-Content-Type-Options    blocks MIME sniffing
 *   Referrer-Policy           leaks no path/query data to off-site links
 *   Permissions-Policy        denies camera/mic/geo/payment by default
 *   Cross-Origin-Opener-Policy isolates the browsing context
 */

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-inline' needed for the server-rendered login page inline <script>
  // and Google Identity Services bootstrap. Tighten with nonce later if needed.
  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://accounts.google.com",
  "frame-src https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP_DIRECTIVES,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

/** Allowed origins for cross-origin API access. Empty = same-origin only. */
const ALLOWED_API_ORIGINS = new Set<string>([
  // Add other origins here if any external app ever needs to call the API.
]);

/**
 * Wrap a response with security headers. Mutates and returns a new Response
 * (Response.headers is immutable on fetched/cf responses, so we clone).
 */
export function withSecurityHeaders(
  response: Response,
  request: Request,
): Response {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  // Tighten CORS: only echo Origin if it's whitelisted. Otherwise no CORS header.
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_API_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Credentials", "true");
  } else {
    // Strip any wildcard CORS header that upstream may have set.
    headers.delete("Access-Control-Allow-Origin");
  }

  // Force correct content-type for JSON-shaped API responses that upstream
  // mistakenly served as text/html (observed on /api/sessions).
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    const ct = headers.get("Content-Type") || "";
    if (ct.startsWith("text/html")) {
      headers.set("Content-Type", "application/json; charset=utf-8");
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
