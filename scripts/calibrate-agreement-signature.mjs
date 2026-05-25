#!/usr/bin/env node
/**
 * Calibrate the signature-box coordinates on the v1.1 Reseller PDF.
 *
 * Renders a placeholder stamp (red rectangle for the signature image area,
 * "Sample Naam" + "20 mei 2026" text, audit footer) onto a local copy of the
 * template, writes the result to /tmp/calibration-output.pdf, and prints the
 * page dimensions so you can iterate.
 *
 * Usage:
 *   node scripts/calibrate-agreement-signature.mjs
 *
 * Edit the SIG_IMAGE / NAAM_FIELD / DATUM_FIELD / AUDIT_FOOTER constants and
 * rerun until the stamp lands inside the actual signature box on page 3.
 * Then copy the locked-in numbers into functions/lib/generate-agreement-pdf.ts.
 */

import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ---- TWEAKABLE COORDS ------------------------------------------------------
// Coordinates are in PDF points, origin = bottom-left of page.
// Template page size: US Letter, 612 x 792 pts.
const SIGNATURE_BOX_PAGE_INDEX = 2; // page 3 of the document
const SIG_IMAGE = { x: 320, y: 165, width: 260, maxHeight: 45 };
const NAAM_FIELD = { x: 396, y: 153, fontSize: 11 };
const DATUM_FIELD = { x: 396, y: 125, fontSize: 11 };
const AUDIT_FOOTER = { x: 56, y: 50, fontSize: 7 };
// ---------------------------------------------------------------------------

const TEMPLATE_PATH = join(
  homedir(),
  "Downloads",
  "Reseller overeenkomst warmtepomp v. 1.1_voor akkoord.pdf",
);
const OUTPUT_PATH = "/tmp/calibration-output.pdf";

async function main() {
  const tmplBytes = await readFile(TEMPLATE_PATH);
  const doc = await PDFDocument.load(tmplBytes);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pages = doc.getPages();
  console.log(`Template has ${pages.length} pages.`);
  pages.forEach((p, i) => {
    const { width, height } = p.getSize();
    console.log(`  page ${i + 1}: ${width} x ${height} pts`);
  });

  if (SIGNATURE_BOX_PAGE_INDEX >= pages.length) {
    throw new Error(
      `SIGNATURE_BOX_PAGE_INDEX ${SIGNATURE_BOX_PAGE_INDEX} out of range (only ${pages.length} pages).`,
    );
  }

  const page = pages[SIGNATURE_BOX_PAGE_INDEX];

  // Red placeholder rectangle for the signature-image area.
  page.drawRectangle({
    x: SIG_IMAGE.x,
    y: SIG_IMAGE.y,
    width: SIG_IMAGE.width,
    height: SIG_IMAGE.maxHeight,
    borderColor: rgb(0.85, 0.2, 0.2),
    borderWidth: 1,
    color: rgb(1, 0.93, 0.93),
    opacity: 0.6,
  });
  page.drawText("[ signature here ]", {
    x: SIG_IMAGE.x + 8,
    y: SIG_IMAGE.y + SIG_IMAGE.maxHeight / 2 - 4,
    size: 9,
    font: helv,
    color: rgb(0.7, 0.1, 0.1),
  });

  // Naam value
  page.drawText("Sample Installatiepartner BV", {
    x: NAAM_FIELD.x,
    y: NAAM_FIELD.y,
    size: NAAM_FIELD.fontSize,
    font: helvBold,
    color: rgb(0, 0, 0),
  });

  // Datum value
  page.drawText("20 mei 2026", {
    x: DATUM_FIELD.x,
    y: DATUM_FIELD.y,
    size: DATUM_FIELD.fontSize,
    font: helvBold,
    color: rgb(0, 0, 0),
  });

  // Audit footer
  page.drawText(
    "Ondertekend op 2026-05-20T13:45:00Z - IP 192.0.2.10 - Versie 1.1 - ID 12345678-90ab-cdef-1234-567890abcdef",
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
  console.log(`\nWrote ${OUTPUT_PATH}`);
  console.log(
    "Open it. If the red rectangle + Naam/Datum land in the actual signature box on page 3, the coords are good.",
  );
  console.log("Iterate the constants at the top of this file until aligned.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
