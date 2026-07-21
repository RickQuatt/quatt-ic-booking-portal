/**
 * HubSpot CRM v3 -- direct contact-property writes with a private-app token.
 *
 * Replaces the Forms API for the properties the booking portal owns: the Forms
 * API returns HTTP 200 but its spam filter silently quarantines submissions it
 * dislikes, so those writes never land. A direct PATCH to crm/v3 either succeeds
 * or returns an honest error we can alert on.
 *
 * Uses plain fetch() -- works in Cloudflare Workers as-is. Never logs the token.
 */

import type { Env } from "./types";
import { postToChannel } from "./slack";

const CONTACTS_URL = "https://api.hubapi.com/crm/v3/objects/contacts";

export type UpsertContactResult =
  | { skipped: true }
  | { skipped: false; created: boolean };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * PATCH once, retrying a single time on 429/5xx after a short delay. Returns the
 * final Response; the caller decides what a non-ok status means (404 -> create).
 */
async function hsFetch(
  env: Env,
  method: "PATCH" | "POST",
  url: string,
  body: unknown,
): Promise<Response> {
  const doFetch = () =>
    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.HUBSPOT_WRITE_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

  let res = await doFetch();
  if (res.status === 429 || res.status >= 500) {
    await sleep(500);
    res = await doFetch();
  }
  return res;
}

async function throwHsError(res: Response): Promise<never> {
  const text = await res.text();
  throw new Error(`HubSpot CRM API error ${res.status}: ${text.slice(0, 300)}`);
}

/**
 * Fire-and-forget audit line. Never throws, never blocks the write result.
 * Silently skipped when the audit channel or bot token is unset.
 */
async function auditWrite(
  env: Env,
  email: string,
  properties: Record<string, string>,
  label: string,
): Promise<void> {
  if (!env.HUBSPOT_AUDIT_CHANNEL || !env.SLACK_BOT_TOKEN) {
    return;
  }
  try {
    const text = `booking-portal write: contact ${email} ${JSON.stringify(properties)} (${label})`;
    await postToChannel(env, env.HUBSPOT_AUDIT_CHANNEL, text);
  } catch (e) {
    console.warn("[hubspot-crm audit failed]", e);
  }
}

/**
 * Upsert contact properties by email. PATCH the existing contact; on 404 create
 * it. Returns { skipped: true } when no write token is configured (safe rollout
 * -- callers fall back to the legacy Forms API). Throws on any non-ok status
 * other than the handled 404 so alertOnFailure wrappers surface it in Slack.
 */
export async function upsertContactProps(
  env: Env,
  email: string,
  properties: Record<string, string>,
  label: string,
): Promise<UpsertContactResult> {
  if (!env.HUBSPOT_WRITE_TOKEN) {
    return { skipped: true };
  }

  const patchUrl = `${CONTACTS_URL}/${encodeURIComponent(email)}?idProperty=email`;
  const res = await hsFetch(env, "PATCH", patchUrl, { properties });

  let created = false;
  if (res.status === 404) {
    // No contact with this email yet -- create it.
    const createRes = await hsFetch(env, "POST", CONTACTS_URL, {
      properties: { ...properties, email },
    });
    if (createRes.status === 409) {
      // Contact exists after all (concurrent create, or a retried POST whose
      // first attempt landed server-side despite a retryable status). HubSpot
      // dedupes contacts by email, so recover with a plain PATCH.
      const retryPatch = await hsFetch(env, "PATCH", patchUrl, { properties });
      if (!retryPatch.ok) {
        await throwHsError(retryPatch);
      }
    } else if (!createRes.ok) {
      await throwHsError(createRes);
    } else {
      created = true;
    }
  } else if (!res.ok) {
    await throwHsError(res);
  }

  // Fire-and-forget: never add Slack latency to the caller's request path.
  // auditWrite catches its own errors; a dropped audit line is acceptable,
  // a slower check-in is not.
  void auditWrite(env, email, properties, label);

  return { skipped: false, created };
}
