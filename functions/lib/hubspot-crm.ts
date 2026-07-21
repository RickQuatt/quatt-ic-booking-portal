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
const COMPANIES_URL = "https://api.hubapi.com/crm/v3/objects/companies";
const DEALS_URL = "https://api.hubapi.com/crm/v4/objects/deals";

// HubSpot association typeId for the "Primary" deal<->company label.
const PRIMARY_COMPANY_ASSOCIATION_TYPE_ID = 5;

export type UpsertContactResult =
  | { skipped: true }
  | { skipped: false; created: boolean };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalize a date for a HubSpot CRM `date`-type property. Those want epoch-ms
 * at EXACTLY UTC midnight -- a value with a time component (e.g. an ISO string
 * with an offset) is rejected. We take the leading YYYY-MM-DD, validate it, and
 * build the timestamp from its parts via Date.UTC so no local-timezone or
 * Date.parse leniency can shift the day. Returns the epoch-ms as a string, or
 * undefined if the input isn't a valid calendar date.
 */
export function toHubSpotDateMs(dateInput: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateInput);
  if (!m) {
    return undefined;
  }
  const [, y, mo, d] = m;
  const year = Number(y);
  const month = Number(mo); // 1-12
  const day = Number(d); // 1-31
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  const ms = Date.UTC(year, month - 1, day);
  // Reject calendar overflow (e.g. 2026-02-31 -> March): the round-trip day
  // must match what we asked for.
  const back = new Date(ms);
  if (back.getUTCMonth() !== month - 1 || back.getUTCDate() !== day) {
    return undefined;
  }
  return String(ms);
}

/**
 * PATCH once, retrying a single time on 429/5xx after a short delay. Returns the
 * final Response; the caller decides what a non-ok status means (404 -> create).
 */
async function hsFetch(
  env: Env,
  method: "GET" | "PATCH" | "POST",
  url: string,
  body?: unknown,
): Promise<Response> {
  const doFetch = () =>
    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.HUBSPOT_WRITE_TOKEN}`,
      },
      // GET carries no body; sending one is rejected by fetch in Workers.
      ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
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
 * Fire-and-forget audit line to the booking-portal HubSpot audit channel.
 * Never throws, never blocks the write result. Silently skipped when the audit
 * channel or bot token is unset. Shared by contact and company writes, and by
 * the agreement flow's "no linked company" notice.
 */
export async function postAudit(env: Env, text: string): Promise<void> {
  if (!env.HUBSPOT_AUDIT_CHANNEL || !env.SLACK_BOT_TOKEN) {
    return;
  }
  try {
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
  // postAudit catches its own errors; a dropped audit line is acceptable,
  // a slower check-in is not.
  void postAudit(
    env,
    `booking-portal write: contact ${email} ${JSON.stringify(properties)} (${label})`,
  );

  return { skipped: false, created };
}

/**
 * Resolve the company associated with a deal, preferring the "Primary" one.
 *
 * GETs crm/v4 deal->company associations and returns the toObjectId of the
 * association labelled Primary (associationTypes contains typeId 5), else the
 * first association. Returns undefined -- never throws -- when there is no write
 * token, the request fails, or the deal has no linked company, so callers can
 * log-and-continue (the KvK/BTW data still lives in D1 + the Sheet).
 */
export async function resolvePrimaryCompanyId(
  env: Env,
  dealId: string,
): Promise<string | undefined> {
  if (!env.HUBSPOT_WRITE_TOKEN) {
    return undefined;
  }

  const url = `${DEALS_URL}/${encodeURIComponent(dealId)}/associations/companies`;
  const res = await hsFetch(env, "GET", url);
  if (!res.ok) {
    return undefined;
  }

  let data: {
    results?: Array<{
      toObjectId?: string | number;
      associationTypes?: Array<{ typeId?: number }>;
    }>;
  };
  try {
    data = await res.json();
  } catch {
    // A 200 with an unparseable body is as good as no association: stay
    // fail-soft so the caller logs the unattached data and continues.
    return undefined;
  }
  const results = Array.isArray(data?.results) ? data.results : [];
  if (results.length === 0) {
    return undefined;
  }

  const primary = results.find(
    (r) =>
      Array.isArray(r.associationTypes) &&
      r.associationTypes.some(
        (t) => t.typeId === PRIMARY_COMPANY_ASSOCIATION_TYPE_ID,
      ),
  );
  const chosen = primary ?? results[0];
  if (chosen.toObjectId === undefined || chosen.toObjectId === null) {
    return undefined;
  }
  return String(chosen.toObjectId);
}

/**
 * Patch company properties by companyId. Returns { skipped: true } when no write
 * token is configured. PATCHes crm/v3 with a single 429/5xx retry (via hsFetch),
 * throwing on any other non-ok status so alertOnFailure wrappers surface it.
 * On success, fires a best-effort audit line (never awaited, never blocks).
 */
export async function upsertCompanyProps(
  env: Env,
  companyId: string,
  properties: Record<string, string>,
  label: string,
): Promise<{ skipped: boolean }> {
  if (!env.HUBSPOT_WRITE_TOKEN) {
    return { skipped: true };
  }

  const url = `${COMPANIES_URL}/${encodeURIComponent(companyId)}`;
  const res = await hsFetch(env, "PATCH", url, { properties });
  if (!res.ok) {
    await throwHsError(res);
  }

  void postAudit(
    env,
    `booking-portal write: company ${companyId} ${JSON.stringify(properties)} (${label})`,
  );

  return { skipped: false };
}
