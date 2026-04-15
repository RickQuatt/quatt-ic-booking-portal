/**
 * Email templates via Resend API.
 * Resend uses fetch() natively -- works in Cloudflare Workers as-is.
 */

import type { Env } from "./types";

async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const from =
    env.EMAIL_FROM ||
    "Quatt Installatiepartners <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error (${res.status}): ${text}`);
  }
}

function formatDateNL(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });
}

function formatTimeNL(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

function baseTemplate(env: Env, content: string): string {
  const logoUrl = `${env.BASE_URL}/quatt-logo.svg`;
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
  <div style="max-width:580px;margin:0 auto;padding:32px 20px;">
    <div style="margin-bottom:32px;">
      <img src="${logoUrl}" alt="Quatt" height="28" style="display:block;" />
    </div>
    <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #E8E4DD;">
      ${content}
    </div>
    <div style="margin-top:24px;padding:0 4px;color:#8A8580;font-size:13px;line-height:1.6;">
      <p>Vragen? Bel ons op <a href="tel:+31208082116" style="color:#FF6933;text-decoration:none;">020 808 2116</a> of mail naar <a href="mailto:zakelijk@quatt.io" style="color:#FF6933;text-decoration:none;">zakelijk@quatt.io</a></p>
      <p style="margin-top:8px;"><em>Dit is een automatisch bericht - niet beantwoorden.</em></p>
      <p style="margin-top:8px;">Quatt B.V. - Kon. Wilhelminaplein 29, 1062 HJ Amsterdam</p>
    </div>
  </div>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px 8px 0;color:#8A8580;font-size:14px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:14px;font-weight:600;">${value}</td>
  </tr>`;
}

// --- Kennismaking: showroom / online (confirmed) ---

export async function sendKennismakingConfirmation(
  env: Env,
  params: {
    to: string;
    partnerName: string;
    companyName: string;
    amName: string;
    date: string;
    startTime: string;
    endTime: string;
    meetingFormat: "showroom" | "online";
    location?: string | null;
    meetLink?: string | null;
    bookingId?: string;
    rescheduleToken?: string;
    cancelToken?: string;
  },
): Promise<void> {
  const {
    to,
    partnerName,
    amName,
    date,
    startTime,
    endTime,
    meetingFormat,
    location,
    meetLink,
    bookingId,
    rescheduleToken,
    cancelToken,
  } = params;

  const rows = [
    detailRow("Datum", formatDateNL(date)),
    detailRow(
      "Tijd",
      `${formatTimeNL(startTime)} - ${formatTimeNL(endTime)}`,
    ),
    detailRow("Account manager", amName),
  ];

  if (meetingFormat === "showroom" && location) {
    rows.push(detailRow("Locatie", location));
  }
  if (meetingFormat === "online" && meetLink) {
    rows.push(
      detailRow(
        "Videogesprek",
        `<a href="${meetLink}" style="color:#FF6933;text-decoration:none;">${meetLink}</a>`,
      ),
    );
  }

  const baseUrl = env.BASE_URL;
  const actionLinks =
    bookingId && rescheduleToken && cancelToken
      ? `<p style="margin:16px 0 0;color:#8A8580;font-size:13px;line-height:1.5;">
        Kun je niet meer? <a href="${baseUrl}/book/kennismaking/reschedule?id=${bookingId}&token=${rescheduleToken}&email=${encodeURIComponent(to)}" style="color:#FF6933;text-decoration:none;">Verplaats je afspraak</a> of <a href="${baseUrl}/book/kennismaking/cancel?id=${bookingId}&token=${cancelToken}&email=${encodeURIComponent(to)}" style="color:#FF6933;text-decoration:none;">annuleer</a>.
      </p>`
      : `<p style="margin:16px 0 0;color:#8A8580;font-size:13px;line-height:1.5;">
        Kun je niet? Laat het ons weten via <a href="tel:+31208082116" style="color:#FF6933;text-decoration:none;">020 808 2116</a>.
      </p>`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Je afspraak is bevestigd</h1>
    <p style="margin:0 0 24px;color:#8A8580;font-size:15px;line-height:1.5;">
      Hoi ${partnerName.split(" ")[0]}, je kennismakingsgesprek staat gepland. We kijken ernaar uit!
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8E4DD;border-bottom:1px solid #E8E4DD;margin-bottom:24px;">
      ${rows.join("")}
    </table>
    <p style="margin:0;color:#8A8580;font-size:14px;line-height:1.5;">
      Je ontvangt ook een agenda-uitnodiging per e-mail.
    </p>
    ${actionLinks}`;

  await sendEmail(
    env,
    to,
    `Bevestiging kennismakingsgesprek - ${formatDateNL(date)}`,
    baseTemplate(env, content),
  );
}

// --- Kennismaking: site visit (callback request) ---

export async function sendSiteVisitConfirmation(
  env: Env,
  params: {
    to: string;
    partnerName: string;
    companyName: string;
    amName: string;
    location: string;
  },
): Promise<void> {
  const { to, partnerName, amName, location } = params;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Bezoekverzoek ontvangen</h1>
    <p style="margin:0 0 24px;color:#8A8580;font-size:15px;line-height:1.5;">
      Hoi ${partnerName.split(" ")[0]}, we hebben je verzoek ontvangen. ${amName} neemt binnen 1 werkdag contact met je op om een afspraak in te plannen.
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8E4DD;border-bottom:1px solid #E8E4DD;margin-bottom:24px;">
      ${detailRow("Locatie", location)}
      ${detailRow("Account manager", amName)}
    </table>
    <p style="margin:0;color:#8A8580;font-size:14px;line-height:1.5;">
      Wil je sneller schakelen? Bel ons op <a href="tel:+31208082116" style="color:#FF6933;text-decoration:none;">020 808 2116</a>.
    </p>`;

  await sendEmail(
    env,
    to,
    "Bevestiging bezoekverzoek - Quatt Installatiepartners",
    baseTemplate(env, content),
  );
}

// --- Training booking confirmation ---

export async function sendTrainingConfirmation(
  env: Env,
  params: {
    to: string;
    partnerName: string;
    sessionDate: string;
    sessionTime: string;
    location: string;
  },
): Promise<void> {
  const { to, partnerName, sessionDate, sessionTime, location } = params;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Je training is bevestigd</h1>
    <p style="margin:0 0 24px;color:#8A8580;font-size:15px;line-height:1.5;">
      Hoi ${partnerName.split(" ")[0]}, je bent aangemeld voor de Quatt producttraining. Tot dan!
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8E4DD;border-bottom:1px solid #E8E4DD;margin-bottom:24px;">
      ${detailRow("Datum", formatDateNL(sessionDate))}
      ${detailRow("Tijd", sessionTime)}
      ${detailRow("Locatie", location)}
    </table>
    <p style="margin:0;color:#8A8580;font-size:14px;line-height:1.5;">
      Je ontvangt ook een agenda-uitnodiging. Neem je laptop mee voor het praktijkgedeelte.
    </p>`;

  await sendEmail(
    env,
    to,
    `Bevestiging producttraining - ${formatDateNL(sessionDate)}`,
    baseTemplate(env, content),
  );
}

// --- First install confirmation ---

export async function sendFirstInstallConfirmation(
  env: Env,
  params: {
    to: string;
    partnerName: string;
    amName: string;
    address: string;
    preferredWeek: string;
  },
): Promise<void> {
  const { to, partnerName, amName, address, preferredWeek } = params;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Eerste installatie aangevraagd</h1>
    <p style="margin:0 0 24px;color:#8A8580;font-size:15px;line-height:1.5;">
      Hoi ${partnerName.split(" ")[0]}, je aanvraag voor de eerste installatie is ontvangen. ${amName} neemt contact met je op om een datum te bevestigen.
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8E4DD;border-bottom:1px solid #E8E4DD;margin-bottom:24px;">
      ${detailRow("Adres", address)}
      ${detailRow("Voorkeursweek", formatDateNL(preferredWeek))}
      ${detailRow("Account manager", amName)}
    </table>
    <p style="margin:0;color:#8A8580;font-size:14px;line-height:1.5;">
      Vragen over de installatie? Bel ons op <a href="tel:+31208082116" style="color:#FF6933;text-decoration:none;">020 808 2116</a>.
    </p>`;

  await sendEmail(
    env,
    to,
    "Bevestiging eerste installatie - Quatt Installatiepartners",
    baseTemplate(env, content),
  );
}

// --- Cancellation confirmation ---

export async function sendCancellationConfirmation(
  env: Env,
  params: {
    to: string;
    partnerName: string;
    companyName: string;
    date: string;
    amName: string;
  },
): Promise<void> {
  const { to, partnerName, date, amName } = params;
  const baseUrl = env.BASE_URL;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Je afspraak is geannuleerd</h1>
    <p style="margin:0 0 24px;color:#8A8580;font-size:15px;line-height:1.5;">
      Hoi ${partnerName.split(" ")[0]}, je kennismakingsgesprek${date ? ` op ${formatDateNL(date)}` : ""} is geannuleerd.
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8E4DD;border-bottom:1px solid #E8E4DD;margin-bottom:24px;">
      ${date ? detailRow("Was gepland op", formatDateNL(date)) : ""}
      ${detailRow("Account manager", amName)}
    </table>
    <p style="margin:0;color:#8A8580;font-size:14px;line-height:1.5;">
      Wil je toch een afspraak inplannen? Bel ons op <a href="tel:+31208082116" style="color:#FF6933;text-decoration:none;">020 808 2116</a> of plan direct via <a href="${baseUrl}/book/kennismaking" style="color:#FF6933;text-decoration:none;">ons boekingsportaal</a>.
    </p>`;

  await sendEmail(
    env,
    to,
    "Afspraak geannuleerd - Quatt Installatiepartners",
    baseTemplate(env, content),
  );
}

// --- Reschedule confirmation ---

export async function sendRescheduleConfirmation(
  env: Env,
  params: {
    to: string;
    partnerName: string;
    companyName: string;
    amName: string;
    date: string;
    startTime: string;
    endTime: string;
    meetingFormat: "showroom" | "online";
    location?: string | null;
    meetLink?: string | null;
    bookingId: string;
    rescheduleToken: string;
    cancelToken: string;
  },
): Promise<void> {
  const {
    to,
    partnerName,
    amName,
    date,
    startTime,
    endTime,
    meetingFormat,
    location,
    meetLink,
    bookingId,
    rescheduleToken,
    cancelToken,
  } = params;

  const rows = [
    detailRow("Nieuwe datum", formatDateNL(date)),
    detailRow(
      "Tijd",
      `${formatTimeNL(startTime)} - ${formatTimeNL(endTime)}`,
    ),
    detailRow("Account manager", amName),
  ];

  if (meetingFormat === "showroom" && location) {
    rows.push(detailRow("Locatie", location));
  }
  if (meetingFormat === "online" && meetLink) {
    rows.push(
      detailRow(
        "Videogesprek",
        `<a href="${meetLink}" style="color:#FF6933;text-decoration:none;">${meetLink}</a>`,
      ),
    );
  }

  const baseUrl = env.BASE_URL;
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;">Je afspraak is verplaatst</h1>
    <p style="margin:0 0 24px;color:#8A8580;font-size:15px;line-height:1.5;">
      Hoi ${partnerName.split(" ")[0]}, je kennismakingsgesprek is verplaatst naar een nieuw moment. We kijken ernaar uit!
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #E8E4DD;border-bottom:1px solid #E8E4DD;margin-bottom:24px;">
      ${rows.join("")}
    </table>
    <p style="margin:0;color:#8A8580;font-size:14px;line-height:1.5;">
      Je ontvangt ook een nieuwe agenda-uitnodiging per e-mail.
    </p>
    <p style="margin:16px 0 0;color:#8A8580;font-size:13px;line-height:1.5;">
      Kun je niet meer? <a href="${baseUrl}/book/kennismaking/reschedule?id=${bookingId}&token=${rescheduleToken}&email=${encodeURIComponent(to)}" style="color:#FF6933;text-decoration:none;">Verplaats je afspraak</a> of <a href="${baseUrl}/book/kennismaking/cancel?id=${bookingId}&token=${cancelToken}&email=${encodeURIComponent(to)}" style="color:#FF6933;text-decoration:none;">annuleer</a>.
    </p>`;

  await sendEmail(
    env,
    to,
    `Afspraak verplaatst - ${formatDateNL(date)}`,
    baseTemplate(env, content),
  );
}
