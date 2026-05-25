/**
 * /book/training/chill -- Quatt Chill RSVP redirect.
 * Quatt Chill is a launch event managed entirely in HubSpot. The booking portal
 * does not host its own RSVP flow; this page just bounces the partner to the
 * existing HubSpot RSVP form. Track ties: ic__training_track="Quatt Chill" gets
 * set on contact submit via the HubSpot form itself, not from D1.
 */

import { useEffect } from "react";

// Quatt Chill Night RSVP -- branded landing page on connect.quatt.io.
// Wraps the HubSpot RSVP form (GUID e41b84ca-ef46-4c44-a610-cced64630aa1).
const CHILL_RSVP_URL = "https://connect.quatt.io/nl-nl/chill-night-20-mei";

export function ChillRedirectPage() {
  useEffect(() => {
    window.location.replace(CHILL_RSVP_URL);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <p className="text-sm text-[#8A8580]">
        Bezig met doorsturen naar de Quatt Chill RSVP...
      </p>
      <p className="mt-4 text-xs text-[#8A8580]">
        Wordt je niet doorgestuurd?{" "}
        <a className="underline text-[#1A1A1A]" href={CHILL_RSVP_URL}>
          Klik hier
        </a>
        .
      </p>
    </div>
  );
}
