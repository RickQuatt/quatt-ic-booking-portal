/**
 * Per-IP sliding-window rate limiter backed by Cloudflare KV.
 *
 * KV is eventually consistent (~60s propagation across regions), which means
 * a determined attacker can briefly burst above the limit. Acceptable here:
 * the goal is to stop accidental floods + script-kiddie spam against booking
 * endpoints, not to repel a sophisticated DDoS (Cloudflare WAF handles that
 * layer further upstream).
 *
 * Window is implemented as a list of timestamps stored under one key per
 * (bucket,IP) pair. We trim entries older than `windowSeconds`, count what
 * remains, and reject if it exceeds `max`.
 */

export interface RateLimitConfig {
  bucket: string; // logical scope (e.g. "bookings", "agreement", "session")
  max: number; // requests allowed per window
  windowSeconds: number; // sliding window size
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds until next allowed request when blocked
}

function clientIp(request: Request): string {
  const cf = request.headers.get("CF-Connecting-IP");
  if (cf) return cf;
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

export async function rateLimit(
  kv: KVNamespace | undefined,
  request: Request,
  cfg: RateLimitConfig,
): Promise<RateLimitResult> {
  if (!kv) {
    // Fail-open if KV is not bound. Logged so we notice in Pages logs.
    console.warn("rateLimit: RATE_LIMIT KV not bound; bypassing");
    return { ok: true, remaining: cfg.max, retryAfter: 0 };
  }

  const ip = clientIp(request);
  const key = `rl:${cfg.bucket}:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - cfg.windowSeconds;

  let timestamps: number[] = [];
  try {
    const raw = await kv.get(key);
    if (raw) {
      timestamps = JSON.parse(raw).filter((t: number) => t > cutoff);
    }
  } catch (e) {
    console.error("rateLimit read error:", e);
    return { ok: true, remaining: cfg.max, retryAfter: 0 };
  }

  if (timestamps.length >= cfg.max) {
    const oldest = timestamps[0];
    const retryAfter = Math.max(1, oldest + cfg.windowSeconds - now);
    return { ok: false, remaining: 0, retryAfter };
  }

  timestamps.push(now);

  // KV TTL is the window size; if no further requests come in, the key
  // expires on its own. Min TTL is 60s.
  await kv
    .put(key, JSON.stringify(timestamps), {
      expirationTtl: Math.max(60, cfg.windowSeconds),
    })
    .catch((e) => console.error("rateLimit write error:", e));

  return {
    ok: true,
    remaining: cfg.max - timestamps.length,
    retryAfter: 0,
  };
}

/** Build a 429 response for a blocked request. */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Te veel verzoeken. Probeer het over een paar minuten opnieuw.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Retry-After": String(result.retryAfter),
      },
    },
  );
}

/**
 * Optional: validate Origin/Referer for state-changing requests as a CSRF
 * defense layer. Booking endpoints are public so we can't require a cookie,
 * but rejecting requests whose Origin doesn't match the request host blocks
 * trivial cross-site form submissions.
 */
export function originMatchesHost(request: Request): boolean {
  const host = request.headers.get("Host");
  if (!host) return true; // can't tell; let it through
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");
  const candidate = origin || referer;
  if (!candidate) return true; // lenient: some legitimate clients omit both
  try {
    const parsed = new URL(candidate);
    return parsed.host === host;
  } catch {
    return false;
  }
}
