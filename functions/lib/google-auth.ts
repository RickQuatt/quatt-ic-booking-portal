/**
 * Google OAuth2 helper for Cloudflare Workers.
 * Uses raw fetch() instead of googleapis npm package.
 *
 * Gets an access token from a refresh token via Google's token endpoint.
 * The refresh token is captured once via OAuth consent and stored as an env var.
 * For internal Workspace apps, refresh tokens don't expire.
 */

import type { Env } from "./types";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Simple in-memory token cache (per isolate)
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(env: Env): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Google token refresh failed (${response.status}): ${text}`,
    );
  }

  const data = (await response.json()) as TokenResponse;

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Helper: make an authenticated request to a Google API.
 */
export async function googleFetch(
  env: Env,
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken(env);

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}
