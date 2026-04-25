/**
 * GET /api/agreement/:version/pdf
 *
 * Serves the unsigned template PDF of the Quatt partnerovereenkomst.
 * Partners download this before signing so they can read the full contract.
 *
 * Content is baked into the bundle (AGREEMENT_PLAINTEXT). PDF is rendered on first
 * request per deploy, then cached at the Cloudflare edge for the TTL.
 */

import {
  AGREEMENT_PLAINTEXT,
  AGREEMENT_VERSION,
  AGREEMENT_UPDATED_AT,
} from "../../../lib/agreement-content";
import { generateAgreementTemplatePdf } from "../../../lib/generate-agreement-pdf";

export const onRequestGet = async (context: {
  request: Request;
  params: { version: string };
}) => {
  const { params } = context;

  // Only serve versions we ship. Version bumps require a redeploy.
  if (params.version !== AGREEMENT_VERSION) {
    return Response.json(
      { error: `Versie ${params.version} niet beschikbaar. Huidige versie: ${AGREEMENT_VERSION}` },
      { status: 404 },
    );
  }

  try {
    const pdfBytes = await generateAgreementTemplatePdf(
      AGREEMENT_PLAINTEXT,
      AGREEMENT_VERSION,
      AGREEMENT_UPDATED_AT,
    );

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Quatt-Partnerovereenkomst-v${AGREEMENT_VERSION}.pdf"`,
        // Cache for 1 day at the edge; any content change = redeploy = new cache key
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("Template PDF generation failed:", err);
    return Response.json(
      { error: "Kon de overeenkomst niet genereren." },
      { status: 500 },
    );
  }
};
