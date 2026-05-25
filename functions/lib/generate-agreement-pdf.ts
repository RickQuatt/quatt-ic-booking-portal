/**
 * Stamps the canonical Quatt Reseller Overeenkomst Warmtepompen PDF with a
 * partner signature, naam, datum + audit footer on page 3.
 *
 * Since 2026-04-30 the contract body is no longer rendered in code -- the
 * legal-supplied PDF is the source of truth (R2: RESELLER_TEMPLATE_R2_KEY).
 * This module fetches that template and adds three things on page 3:
 *   1. The signature PNG (canvas data URL) inside the signature row of the
 *      "Voor akkoord getekend door Installatiepartner" box.
 *   2. The signer's name next to the "Naam:" label.
 *   3. Today's date next to the "Datum:" label (Dutch format).
 * Plus a 7pt audit footer at the page bottom: signed-at / IP / version / id.
 *
 * Coordinates were calibrated visually via scripts/calibrate-agreement-signature.mjs.
 * Page size is US Letter (612 x 792), origin bottom-left.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { RESELLER_TEMPLATE_R2_KEY } from "./agreement-content";
import type { Env } from "./types";

// ---------------------------------------------------------------------------
// Coordinate constants -- locked in via the calibration script. Keep these in
// sync with scripts/calibrate-agreement-signature.mjs.
// ---------------------------------------------------------------------------
const SIGNATURE_BOX_PAGE_INDEX = 2;
const SIG_IMAGE = { x: 320, y: 165, width: 260, maxHeight: 45 };
const NAAM_FIELD = { x: 396, y: 153, fontSize: 11 };
const DATUM_FIELD = { x: 396, y: 125, fontSize: 11 };
const AUDIT_FOOTER = { x: 56, y: 50, fontSize: 7 };

// Quatt ink + muted grey, matching brand.
const COLOR_INK = rgb(0.075, 0.102, 0.125); // #131A20
const COLOR_MUTED = rgb(0.4, 0.4, 0.4);

const DUTCH_MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

/** Format an ISO 8601 timestamp as "DD <maand> YYYY" (Dutch). */
function formatDutchDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getUTCDate()} ${DUTCH_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Fetch the unsigned reseller-overeenkomst PDF bytes from R2. Used by both
 * the public template endpoint and the signed-PDF generator.
 */
export async function fetchTemplatePdf(env: Env): Promise<Uint8Array> {
  if (!env.AGREEMENTS) throw new Error("AGREEMENTS R2 binding missing");
  const obj = await env.AGREEMENTS.get(RESELLER_TEMPLATE_R2_KEY);
  if (!obj) {
    throw new Error(
      `Reseller template missing in R2 at key ${RESELLER_TEMPLATE_R2_KEY}`,
    );
  }
  const buf = await obj.arrayBuffer();
  return new Uint8Array(buf);
}

export interface SignedAgreementInput {
  /** Person signing on behalf of the installer (rendered next to "Naam:"). */
  contactPerson: string;
  /** Canvas PNG data URL of the partner's signature. */
  signaturePngDataUrl: string;
  /** ISO 8601 server timestamp at sign moment. */
  signedAt: string;
  /** Cloudflare-detected client IP at sign moment. */
  signedIp: string;
  /** Agreement version (e.g. "1.1"). */
  version: string;
  /** D1 row id (UUID v4) for traceability. */
  agreementId: string;
}

/**
 * Load the static reseller PDF from R2 and stamp the signature box on page 3.
 * Returns the final PDF bytes ready to upload to R2.
 */
export async function generateSignedAgreementPdf(
  env: Env,
  input: SignedAgreementInput,
): Promise<Uint8Array> {
  const tmplBytes = await fetchTemplatePdf(env);
  const doc = await PDFDocument.load(tmplBytes);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helv = await doc.embedFont(StandardFonts.Helvetica);

  const pages = doc.getPages();
  if (SIGNATURE_BOX_PAGE_INDEX >= pages.length) {
    throw new Error(
      `Template has only ${pages.length} pages; expected page index ${SIGNATURE_BOX_PAGE_INDEX}.`,
    );
  }
  const page = pages[SIGNATURE_BOX_PAGE_INDEX];

  // 1. Embed signature PNG and draw it scaled into the signature box.
  const b64 = input.signaturePngDataUrl.replace(/^data:image\/png;base64,/, "");
  try {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const png = await doc.embedPng(bytes);

    // Fit-inside-box: scale to whichever dimension is the binding constraint.
    const widthScale = SIG_IMAGE.width / png.width;
    const heightScale = SIG_IMAGE.maxHeight / png.height;
    const scale = Math.min(widthScale, heightScale);
    const drawnWidth = png.width * scale;
    const drawnHeight = png.height * scale;

    // Horizontally centre + bottom-align inside the signature row.
    const drawnX = SIG_IMAGE.x + (SIG_IMAGE.width - drawnWidth) / 2;
    const drawnY = SIG_IMAGE.y + (SIG_IMAGE.maxHeight - drawnHeight) / 2;
    page.drawImage(png, {
      x: drawnX,
      y: drawnY,
      width: drawnWidth,
      height: drawnHeight,
    });
  } catch (err) {
    // Don't break the contract over an unparseable signature -- leave a marker.
    console.error("Failed to embed signature PNG:", err);
    page.drawText("[Handtekening niet leesbaar]", {
      x: SIG_IMAGE.x,
      y: SIG_IMAGE.y + SIG_IMAGE.maxHeight / 2,
      size: 9,
      font: helv,
      color: COLOR_MUTED,
    });
  }

  // 2. Naam value next to the "Naam:" label.
  page.drawText(input.contactPerson, {
    x: NAAM_FIELD.x,
    y: NAAM_FIELD.y,
    size: NAAM_FIELD.fontSize,
    font: helvBold,
    color: COLOR_INK,
  });

  // 3. Datum value next to the "Datum:" label (Dutch format).
  page.drawText(formatDutchDate(input.signedAt), {
    x: DATUM_FIELD.x,
    y: DATUM_FIELD.y,
    size: DATUM_FIELD.fontSize,
    font: helvBold,
    color: COLOR_INK,
  });

  // 4. Audit footer above the green decorative band.
  const auditLine = `Ondertekend op ${input.signedAt} - IP ${input.signedIp} - Versie ${input.version} - ID ${input.agreementId}`;
  page.drawText(auditLine, {
    x: AUDIT_FOOTER.x,
    y: AUDIT_FOOTER.y,
    size: AUDIT_FOOTER.fontSize,
    font: helv,
    color: COLOR_MUTED,
  });

  return doc.save();
}
