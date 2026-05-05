#!/usr/bin/env node
/**
 * Preview the *exact* signed-PDF output without hitting production.
 *
 * Mirrors the production code path in functions/lib/generate-agreement-pdf.ts:
 * load the local Reseller PDF, embed a sample signature PNG inside the
 * page-3 signature box, draw "Naam:" + "Datum:" values + audit footer.
 *
 * Outputs to /tmp/preview-signed-agreement.pdf.
 *
 *   node scripts/preview-signed-agreement.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const SIGNATURE_BOX_PAGE_INDEX = 2;
const SIG_IMAGE = { x: 320, y: 165, width: 260, maxHeight: 45 };
const NAAM_FIELD = { x: 396, y: 153, fontSize: 11 };
const DATUM_FIELD = { x: 396, y: 125, fontSize: 11 };
const AUDIT_FOOTER = { x: 56, y: 50, fontSize: 7 };

const TEMPLATE_PATH = join(
  homedir(),
  "Downloads",
  "Reseller overeenkomst warmtepomp v. 1.1_voor akkoord.pdf",
);
const OUTPUT_PATH = "/tmp/preview-signed-agreement.pdf";

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

function formatDutchDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getUTCDate()} ${DUTCH_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Hand-rolled "signature": a stylized cursive squiggle drawn as a tiny PNG.
// 320x80 px, transparent background, dark stroke. Constructed via a 1x1
// repeating gradient + pdf-lib drawing into a sub-document, then exported.
async function buildFakeSignaturePng() {
  // Easier: load a real-ish PNG. We synthesise one with PDFDocument by drawing
  // strokes onto a small white page, then exporting a screenshot... but that's
  // overkill. Instead: a 200x60 PNG filled with the partner's "name" in cursive
  // approximation using a wavy line. We just hand-craft a base64 PNG.
  // 1x1 black pixel base64; we'll just embed that as a placeholder so the
  // image-fitting code path runs. Visual fidelity isn't the point of this
  // preview -- coordinate alignment is.
  const oneByOneBlackPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
    "base64",
  );
  // Stretch a 1x1 pixel to fill the box -- ugly but proves embed + draw works.
  return new Uint8Array(oneByOneBlackPng);
}

async function main() {
  const tmplBytes = await readFile(TEMPLATE_PATH);
  const doc = await PDFDocument.load(tmplBytes);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helv = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.getPages()[SIGNATURE_BOX_PAGE_INDEX];

  // Real-ish signature image (a black filled rectangle as proxy).
  const sigBytes = await buildFakeSignaturePng();
  const png = await doc.embedPng(sigBytes);

  // Stretch to box (the production code computes a fit-scale per actual PNG;
  // here the stretch is fine for visual verification).
  page.drawImage(png, {
    x: SIG_IMAGE.x + 10,
    y: SIG_IMAGE.y + 5,
    width: SIG_IMAGE.width - 20,
    height: SIG_IMAGE.maxHeight - 10,
    opacity: 0.65,
  });

  page.drawText("Rick Hakkaart", {
    x: NAAM_FIELD.x,
    y: NAAM_FIELD.y,
    size: NAAM_FIELD.fontSize,
    font: helvBold,
    color: rgb(0.075, 0.102, 0.125),
  });

  page.drawText(formatDutchDate(new Date().toISOString()), {
    x: DATUM_FIELD.x,
    y: DATUM_FIELD.y,
    size: DATUM_FIELD.fontSize,
    font: helvBold,
    color: rgb(0.075, 0.102, 0.125),
  });

  const fakeId = "12345678-90ab-cdef-1234-567890abcdef";
  page.drawText(
    `Ondertekend op ${new Date().toISOString()} - IP 192.0.2.10 - Versie 1.1 - ID ${fakeId}`,
    {
      x: AUDIT_FOOTER.x,
      y: AUDIT_FOOTER.y,
      size: AUDIT_FOOTER.fontSize,
      font: helv,
      color: rgb(0.4, 0.4, 0.4),
    },
  );

  const out = await doc.save();
  await writeFile(OUTPUT_PATH, out);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
