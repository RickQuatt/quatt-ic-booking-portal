/**
 * HMAC signing/verification for partner-facing booking links.
 * Uses Web Crypto API (Cloudflare Workers compatible -- no Node.js crypto).
 *
 * Token = base64url(timestamp:hmac). No DB storage needed.
 * Expires after 30 days.
 */

function hexEncode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64urlEncode(str: string): string {
  const encoded = btoa(str);
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): string {
  let padded = str.replace(/-/g, "+").replace(/_/g, "/");
  while (padded.length % 4 !== 0) {
    padded += "=";
  }
  return atob(padded);
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return hexEncode(signature);
}

export async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.length !== bBytes.length) return false;

  // Use crypto.subtle.timingSafeEqual if available (Cloudflare Workers)
  if (typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(aBytes, bBytes);
  }

  // Fallback: constant-time compare
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

/**
 * Sign a booking action (reschedule/cancel) for partner-facing links.
 */
export async function signBookingAction(
  secret: string,
  bookingId: string,
  email: string,
  action: "reschedule" | "cancel",
): Promise<string> {
  if (!secret) throw new Error("BOOKING_SECRET not configured");

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${bookingId}:${email}:${action}:${timestamp}`;
  const hmac = await hmacSign(secret, payload);

  return base64urlEncode(`${timestamp}:${hmac}`);
}

/**
 * Verify a signed booking action token.
 * Returns true if valid and not expired (30 days).
 */
export async function verifyBookingAction(
  secret: string,
  token: string,
  bookingId: string,
  email: string,
  action: "reschedule" | "cancel",
): Promise<boolean> {
  if (!secret || !token) return false;

  try {
    const decoded = base64urlDecode(token);
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return false;

    const timestampStr = decoded.substring(0, colonIndex);
    const providedHmac = decoded.substring(colonIndex + 1);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) return false;

    // Check expiry (30 days)
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60;
    if (now - timestamp > thirtyDays) return false;

    // Recompute HMAC
    const payload = `${bookingId}:${email}:${action}:${timestamp}`;
    const expected = await hmacSign(secret, payload);

    // Timing-safe comparison
    return await timingSafeCompare(providedHmac, expected);
  } catch {
    return false;
  }
}
