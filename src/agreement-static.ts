/**
 * Re-export of the baked agreement content for the browser bundle.
 *
 * Both the Cloudflare Function (functions/lib/agreement-content.ts) and the
 * React page import from here. Keeping the single source in functions/lib/
 * avoids drift between what the page renders and what the PDF embeds.
 */

export {
  AGREEMENT_HTML,
  AGREEMENT_PLAINTEXT,
  AGREEMENT_VERSION,
  AGREEMENT_UPDATED_AT,
} from "../functions/lib/agreement-content";
