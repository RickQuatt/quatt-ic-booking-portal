/**
 * Google Sheets operations via REST API v4.
 * Replaces googleapis SDK with raw fetch() for Cloudflare Workers.
 */

import { googleFetch } from "./google-auth";
import type { BookingType, Env } from "./types";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const SHEET_NAME = "IC Bookings";
const AGREEMENT_SHEET_NAME = "IC Agreements";

export async function appendBookingRow(
  env: Env,
  params: {
    type: BookingType;
    partnerName: string;
    email: string;
    phone: string;
    company: string;
    date: string;
    am: string;
    status: string;
    hubspotDealId: string;
  },
): Promise<string | null> {
  const sheetId = env.IC_BOOKINGS_SHEET_ID;
  if (!sheetId) return null;

  const timestamp = new Date().toISOString();
  const row = [
    timestamp,
    params.type,
    params.partnerName,
    params.email,
    params.phone,
    params.company,
    params.date,
    params.am,
    params.status,
    params.hubspotDealId,
  ];

  const range = encodeURIComponent(`${SHEET_NAME}!A:J`);
  const res = await googleFetch(
    env,
    `${SHEETS_BASE}/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      body: JSON.stringify({ values: [row] }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets append failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    updates?: { updatedRange?: string };
  };
  return data.updates?.updatedRange || null;
}

export async function appendAgreementRow(
  env: Env,
  params: {
    companyName: string;
    kvkNumber: string;
    btwNumber: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    signedAt: string;
    dealId: string;
  },
): Promise<string | null> {
  const sheetId = env.IC_AGREEMENTS_SHEET_ID || env.IC_BOOKINGS_SHEET_ID;
  if (!sheetId) return null;

  const row = [
    params.signedAt,
    params.companyName,
    params.kvkNumber,
    params.btwNumber,
    params.contactPerson,
    params.email,
    params.phone,
    params.address,
    params.dealId,
    "signed",
  ];

  const range = encodeURIComponent(`${AGREEMENT_SHEET_NAME}!A:J`);
  const res = await googleFetch(
    env,
    `${SHEETS_BASE}/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      body: JSON.stringify({ values: [row] }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agreement sheet append failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    updates?: { updatedRange?: string };
  };
  return data.updates?.updatedRange || null;
}

export async function updateBookingRow(
  env: Env,
  rowRange: string,
  updates: { status?: string; hubspotDealId?: string },
): Promise<void> {
  const sheetId = env.IC_BOOKINGS_SHEET_ID;
  if (!sheetId) return;

  // Read current row
  const encodedRange = encodeURIComponent(rowRange);
  const getRes = await googleFetch(
    env,
    `${SHEETS_BASE}/${sheetId}/values/${encodedRange}`,
  );

  if (!getRes.ok) return;

  const data = (await getRes.json()) as { values?: string[][] };
  const row = data.values?.[0];
  if (!row) return;

  // Update fields (status = index 8, dealId = index 9)
  if (updates.status) row[8] = updates.status;
  if (updates.hubspotDealId) row[9] = updates.hubspotDealId;

  await googleFetch(
    env,
    `${SHEETS_BASE}/${sheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [row] }),
    },
  );
}
