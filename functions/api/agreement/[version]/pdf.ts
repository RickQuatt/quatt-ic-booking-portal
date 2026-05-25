/**
 * GET /api/agreement/:version/pdf
 *
 * Streams the canonical legal PDF (Reseller Overeenkomst Warmtepompen) from
 * R2. Partners download this before signing so they can read the full contract
 * exactly as legal authored it. Since 2026-04-30 we no longer regenerate the
 * body in code -- the static PDF is the source of truth.
 *
 * Content is fetched from R2 on each request; CF edge cache (24h) keeps the
 * actual fetch count low. Bumping AGREEMENT_VERSION + uploading the new file
 * to a new R2 key invalidates the cache on the next deploy.
 */

import {
  AGREEMENT_VERSION,
} from "../../../lib/agreement-content";
import { fetchTemplatePdf } from "../../../lib/generate-agreement-pdf";
import type { Env } from "../../../lib/types";

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
  params: { version: string };
}) => {
  const { env, params } = context;

  // Only serve versions we ship. Version bumps require a redeploy + R2 upload.
  if (params.version !== AGREEMENT_VERSION) {
    return Response.json(
      { error: `Versie ${params.version} niet beschikbaar. Huidige versie: ${AGREEMENT_VERSION}` },
      { status: 404 },
    );
  }

  try {
    const pdfBytes = await fetchTemplatePdf(env);

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Quatt-Reseller-Overeenkomst-v${AGREEMENT_VERSION}.pdf"`,
        // Cache for 1 day at the edge; uploading a new template + version bump
        // produces a different key + different bytes, so cache turns over.
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("Template PDF fetch failed:", err);
    return Response.json(
      { error: "Kon de overeenkomst niet laden." },
      { status: 500 },
    );
  }
};
