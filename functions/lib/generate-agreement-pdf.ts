/**
 * Generates a signed-agreement PDF using pdf-lib (pure JS, Workers-compatible).
 *
 * Layout: Quatt letterhead -> partner fields table -> agreement plaintext -> signature image
 * -> audit footer (signed at / IP / version).
 *
 * Input agreement content is plaintext with blank-line paragraph breaks (see
 * functions/lib/agreement-content.ts). Keeping it plaintext sidesteps HTML parsing
 * quirks and produces a consistent printable artifact.
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

export interface AgreementPdfInput {
  companyName: string;
  kvkNumber: string;
  btwNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  city: string;
  dealId?: string;
  version: string;
  signedAt: string;
  signedIp: string;
  signaturePngDataUrl: string;
  agreementPlainText: string;
}

const MARGIN = 56;
const PAGE_WIDTH = 595; // A4 portrait
const PAGE_HEIGHT = 842;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLOR_TEXT = rgb(0.102, 0.102, 0.102); // #1A1A1A
const COLOR_MUTED = rgb(0.541, 0.525, 0.502); // #8A8580
const COLOR_LINE = rgb(0.91, 0.894, 0.867); // #E8E4DD
const COLOR_BRAND = rgb(1, 0.412, 0.2); // #FF6933

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Map non-WinAnsi characters to a safe replacement. */
function toSafeAscii(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code < 0x80) out += ch;
    else if (ch === "\u00A0") out += " ";
    else if (ch === "\u2013" || ch === "\u2014") out += "-";
    else if (ch === "\u2018" || ch === "\u2019") out += "'";
    else if (ch === "\u201C" || ch === "\u201D") out += '"';
    else if (ch === "\u2022") out += "-";
    else if (ch === "\u20AC") out += "EUR";
    else if (code < 0x100) out += ch;
    else out += "?";
  }
  return out;
}

class PdfCursor {
  page: PDFPage;
  y: number;
  constructor(page: PDFPage) {
    this.page = page;
    this.y = PAGE_HEIGHT - MARGIN;
  }
}

function newPage(doc: PDFDocument): PdfCursor {
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return new PdfCursor(page);
}

function ensureSpace(doc: PDFDocument, cursor: PdfCursor, needed: number): PdfCursor {
  if (cursor.y - needed < MARGIN) return newPage(doc);
  return cursor;
}

function drawText(
  cursor: PdfCursor,
  text: string,
  x: number,
  font: PDFFont,
  size: number,
  color = COLOR_TEXT,
) {
  cursor.page.drawText(toSafeAscii(text), { x, y: cursor.y, size, font, color });
}

/** Simple paragraph renderer: blank lines split paragraphs; ALL CAPS short lines render as headings. */
function renderBody(
  doc: PDFDocument,
  start: PdfCursor,
  text: string,
  regular: PDFFont,
  bold: PDFFont,
): PdfCursor {
  let cursor = start;
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const para of paragraphs) {
    const isHeading =
      para.length < 80 &&
      !para.includes("\n") &&
      /^[A-Z0-9][A-Z0-9 ./()-]+$/.test(para.trim());

    const size = isHeading ? 11 : 9.5;
    const font = isHeading ? bold : regular;
    const lineHeight = size * 1.45;

    if (isHeading) {
      cursor = ensureSpace(doc, cursor, lineHeight + 12);
      cursor.y -= 6;
      drawText(cursor, para, MARGIN, font, size);
      cursor.y -= lineHeight + 2;
      continue;
    }

    // Non-heading paragraph -- may contain internal single-newlines (soft breaks) or bullets.
    const softLines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const rawLine of softLines) {
      const isBullet = /^[-*\u2022]\s+/.test(rawLine);
      const clean = rawLine.replace(/^[-*\u2022]\s+/, "");
      const indent = isBullet ? 14 : 0;
      const prefix = isBullet ? "- " : "";
      const lines = wrapText(prefix + clean, font, size, CONTENT_WIDTH - indent);
      for (const line of lines) {
        cursor = ensureSpace(doc, cursor, lineHeight);
        drawText(cursor, line, MARGIN + indent, font, size);
        cursor.y -= lineHeight;
      }
    }
    cursor.y -= 4;
  }

  return cursor;
}

/**
 * Generates an UNSIGNED template PDF of just the agreement body.
 * Used by GET /api/agreement/v2.pdf so partners can download + read the full document
 * before signing. Same content renderer as the signed PDF, no partner fields.
 */
export async function generateAgreementTemplatePdf(
  agreementPlainText: string,
  version: string,
  updatedAt: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let cursor = newPage(doc);

  doc.getPages()[0].drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 4,
    width: PAGE_WIDTH,
    height: 4,
    color: COLOR_BRAND,
  });

  drawText(cursor, "QUATT", MARGIN, bold, 20, COLOR_TEXT);
  cursor.page.drawText("Partnerovereenkomst", {
    x: MARGIN,
    y: cursor.y - 22,
    size: 11,
    font: regular,
    color: COLOR_MUTED,
  });
  cursor.page.drawText(`Versie ${version} - laatst herzien ${updatedAt}`, {
    x: MARGIN,
    y: cursor.y - 38,
    size: 9,
    font: regular,
    color: COLOR_MUTED,
  });
  cursor.page.drawRectangle({
    x: MARGIN,
    y: cursor.y - 48,
    width: CONTENT_WIDTH,
    height: 1,
    color: COLOR_LINE,
  });
  cursor.y -= 68;

  cursor = renderBody(doc, cursor, agreementPlainText, regular, bold);

  // Footer on every page.
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    p.drawText(
      `Quatt Installaties B.V.  -  Koningin Wilhelminaplein 29, 1062 HJ Amsterdam  -  KvK 88274969`,
      { x: MARGIN, y: 28, size: 8, font: regular, color: COLOR_MUTED },
    );
    p.drawText(
      `Pagina ${i + 1} van ${pages.length}  -  Versie ${version}  -  Template (niet ondertekend)`,
      { x: MARGIN, y: 16, size: 8, font: regular, color: COLOR_MUTED },
    );
  }

  return doc.save();
}

export async function generateAgreementPdf(input: AgreementPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let cursor = newPage(doc);

  // Brand stripe on page 1.
  doc.getPages()[0].drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 4,
    width: PAGE_WIDTH,
    height: 4,
    color: COLOR_BRAND,
  });

  // Letterhead.
  drawText(cursor, "QUATT", MARGIN, bold, 20, COLOR_TEXT);
  cursor.page.drawText("Partnerovereenkomst", {
    x: MARGIN,
    y: cursor.y - 22,
    size: 11,
    font: regular,
    color: COLOR_MUTED,
  });
  cursor.page.drawRectangle({
    x: MARGIN,
    y: cursor.y - 32,
    width: CONTENT_WIDTH,
    height: 1,
    color: COLOR_LINE,
  });
  cursor.y -= 56;

  // Partner fields.
  drawText(cursor, "Installatiepartner", MARGIN, bold, 12);
  cursor.y -= 18;

  const rows: [string, string][] = [
    ["Bedrijfsnaam", input.companyName],
    ["KvK-nummer", input.kvkNumber],
    ["BTW-nummer", input.btwNumber],
    ["Contactpersoon", input.contactPerson],
    ["E-mail", input.email],
    ["Telefoon", input.phone],
    ["Adres", `${input.address}, ${input.postcode} ${input.city}`],
  ];
  if (input.dealId) rows.push(["HubSpot deal", input.dealId]);

  for (const [label, value] of rows) {
    cursor = ensureSpace(doc, cursor, 16);
    drawText(cursor, label, MARGIN, regular, 10, COLOR_MUTED);
    drawText(cursor, value, MARGIN + 130, regular, 10, COLOR_TEXT);
    cursor.y -= 16;
  }

  cursor.y -= 8;
  cursor.page.drawRectangle({
    x: MARGIN,
    y: cursor.y,
    width: CONTENT_WIDTH,
    height: 1,
    color: COLOR_LINE,
  });
  cursor.y -= 24;

  // Agreement body.
  drawText(cursor, "Overeenkomst", MARGIN, bold, 12);
  cursor.y -= 20;

  cursor = renderBody(doc, cursor, input.agreementPlainText, regular, bold);

  // Signature block.
  cursor = ensureSpace(doc, cursor, 200);
  cursor.y -= 12;
  cursor.page.drawRectangle({
    x: MARGIN,
    y: cursor.y,
    width: CONTENT_WIDTH,
    height: 1,
    color: COLOR_LINE,
  });
  cursor.y -= 24;

  drawText(cursor, "Handtekening", MARGIN, bold, 12);
  cursor.y -= 20;

  const b64 = input.signaturePngDataUrl.replace(/^data:image\/png;base64,/, "");
  try {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const png = await doc.embedPng(bytes);
    const sigWidth = 200;
    const sigHeight = (png.height / png.width) * sigWidth;
    cursor = ensureSpace(doc, cursor, sigHeight + 24);
    cursor.page.drawImage(png, {
      x: MARGIN,
      y: cursor.y - sigHeight,
      width: sigWidth,
      height: sigHeight,
    });
    cursor.y -= sigHeight + 12;
  } catch (err) {
    console.error("Failed to embed signature PNG:", err);
    drawText(cursor, "[Handtekening niet leesbaar]", MARGIN, regular, 10, COLOR_MUTED);
    cursor.y -= 18;
  }

  cursor.page.drawRectangle({
    x: MARGIN,
    y: cursor.y,
    width: 220,
    height: 1,
    color: COLOR_TEXT,
  });
  cursor.y -= 14;
  drawText(
    cursor,
    `${input.contactPerson} namens ${input.companyName}`,
    MARGIN,
    regular,
    9.5,
  );
  cursor.y -= 24;

  // Audit footer.
  cursor = ensureSpace(doc, cursor, 48);
  cursor.page.drawRectangle({
    x: MARGIN,
    y: cursor.y,
    width: CONTENT_WIDTH,
    height: 1,
    color: COLOR_LINE,
  });
  cursor.y -= 14;
  const signedDate = new Date(input.signedAt).toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
  });
  drawText(
    cursor,
    `Ondertekend op ${signedDate} (Europe/Amsterdam)  -  IP ${input.signedIp}  -  Versie ${input.version}`,
    MARGIN,
    regular,
    8.5,
    COLOR_MUTED,
  );
  cursor.y -= 12;
  drawText(
    cursor,
    "Quatt Installaties B.V.  -  Koningin Wilhelminaplein 29, 1062 HJ Amsterdam  -  KvK 88274969",
    MARGIN,
    regular,
    8.5,
    COLOR_MUTED,
  );

  return doc.save();
}
