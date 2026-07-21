/**
 * HubSpot CRM sync for a signed partner agreement.
 *
 * The source of truth for agreement data (unlike the spam-filterable Forms
 * submission the route keeps only as a Partner-Progression enrollment signal).
 * Two independent writes:
 *
 *  - the standard partner contact fields (firstname/lastname/company/phone/
 *    address), and
 *  - the company KvK/BTW numbers, but only when the deal resolves to a linked
 *    company. If none is linked we record an audit line and move on -- we never
 *    auto-create a company (the data still lives in D1 + the Sheet).
 *
 * Extracted from functions/api/agreements.ts so it can be unit-tested without
 * dragging in the route's D1/R2/PDF/walleos machinery.
 */

import type { Env } from "./types";
import {
  upsertContactProps,
  resolvePrimaryCompanyId,
  upsertCompanyProps,
  postAudit,
} from "./hubspot-crm";

export interface AgreementHubSpotData {
  email: string;
  firstname: string;
  lastname: string;
  company: string;
  phone: string;
  /** Pre-composed `${address}, ${postcode} ${city}`. */
  address: string;
  kvkNumber: string;
  btwNumber: string;
  dealId?: string;
}

/**
 * Push contact + company data to HubSpot. The two writes run concurrently so
 * neither can suppress the other; if either throws, an aggregate error is raised
 * so the caller's alert wrapper surfaces it while the HTTP response stays 200.
 */
export async function syncAgreementToHubSpot(
  env: Env,
  data: AgreementHubSpotData,
): Promise<void> {
  const results = await Promise.allSettled([
    upsertContactProps(
      env,
      data.email,
      {
        firstname: data.firstname,
        lastname: data.lastname,
        company: data.company,
        phone: data.phone,
        address: data.address,
      },
      "agreement signed",
    ),
    syncAgreementCompany(env, data),
  ]);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) =>
      r.reason instanceof Error ? r.reason.message : String(r.reason),
    );
  if (errors.length) {
    throw new Error(`agreement HubSpot sync failed: ${errors.join("; ")}`);
  }
}

async function syncAgreementCompany(
  env: Env,
  data: AgreementHubSpotData,
): Promise<void> {
  const companyId = data.dealId
    ? await resolvePrimaryCompanyId(env, data.dealId)
    : undefined;
  if (companyId) {
    await upsertCompanyProps(
      env,
      companyId,
      {
        commercial_registration_number__kvk_: data.kvkNumber,
        vat_number_btw: data.btwNumber,
      },
      "agreement kvk/btw",
    );
    return;
  }
  // No dealId, or the deal has no linked company -- record it once and stop.
  // Never auto-create a company.
  await postAudit(
    env,
    `agreement KvK/BTW not attached: ${data.company} ${data.email} -- no linked HubSpot company (data in D1 + Sheet)`,
  );
}
