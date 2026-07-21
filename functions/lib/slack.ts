/**
 * Slack notifications via Bot token.
 * Already uses fetch() -- works in Cloudflare Workers as-is.
 */

import type { Env } from "./types";

const ALERT_CHANNEL_FALLBACK = "C0B2E5S1XHD"; // #wall-e-alerts -- single sink for silent-failure signals.

export async function sendSlackNotification(
  env: Env,
  text: string,
): Promise<boolean> {
  if (!env.SLACK_BOT_TOKEN) {
    console.error("SLACK_BOT_TOKEN not configured");
    return false;
  }

  const channelId = env.SLACK_CHANNEL_ID || "C0AN03L2LK0";

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel: channelId,
      text,
      mrkdwn: true,
    }),
  });

  const data = (await response.json()) as { ok: boolean };
  return data.ok === true;
}

/**
 * Post to an explicit Slack channel via chat.postMessage. Same shape as
 * sendSlackNotification but the channel is passed in rather than read from env.
 * Used by the HubSpot CRM audit trail (functions/lib/hubspot-crm.ts).
 */
export async function postToChannel(
  env: Env,
  channelId: string,
  text: string,
): Promise<boolean> {
  if (!env.SLACK_BOT_TOKEN) {
    console.error("SLACK_BOT_TOKEN not configured");
    return false;
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel: channelId,
      text,
      mrkdwn: true,
    }),
  });

  const data = (await response.json()) as { ok: boolean };
  return data.ok === true;
}

/**
 * Send to the central Wall-e alerts channel (#wall-e-alerts, C0B2E5S1XHD).
 * Used for silent-failure signals: HubSpot Forms drops, Wall-e OS push fails,
 * etc. Falls back to console.error when the bot token is missing so the alert
 * never blocks the request path.
 */
export async function sendAlert(env: Env, text: string): Promise<void> {
  if (!env.SLACK_BOT_TOKEN) {
    console.error("[alert]", text);
    return;
  }
  const channelId = env.SLACK_ALERT_CHANNEL_ID || ALERT_CHANNEL_FALLBACK;
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({ channel: channelId, text, mrkdwn: true }),
    });
  } catch (e) {
    console.error("[alert post failed]", text, e);
  }
}

/**
 * Wrap a fire-and-forget promise so any rejection lands in #wall-e-alerts.
 * Use with ctx.waitUntil() at call sites so Cloudflare keeps the worker alive
 * until the promise settles. Returns a void promise that never rejects.
 */
export function alertOnFailure<T>(
  env: Env,
  label: string,
  p: Promise<T>,
): Promise<void> {
  return p.then(
    () => undefined,
    async (e) => {
      const msg =
        `:rotating_light: *${label}* failed\n` +
        "```" +
        (e instanceof Error
          ? `${e.message}\n${e.stack ?? ""}`
          : String(e)
        ).slice(0, 1500) +
        "```";
      console.error(`[${label}]`, e);
      await sendAlert(env, msg);
    },
  );
}

export function formatTrainingBookingNotification(params: {
  partnerName: string;
  companyName: string;
  trainingDate: string;
  spotsRemaining: number;
  totalSpots: number;
}): string {
  return [
    `*Nieuwe training boeking*`,
    `Partner: ${params.partnerName} (${params.companyName})`,
    `Training: ${params.trainingDate}`,
    `Plekken: ${params.spotsRemaining}/${params.totalSpots} beschikbaar`,
  ].join("\n");
}

export function formatIntroCallNotification(params: {
  partnerName: string;
  companyName: string;
  amName: string;
  date: string;
  time: string;
  phone: string;
  meetingFormat?: string;
}): string {
  const lines = [
    `*Nieuwe kennismaking ingepland*`,
    `Partner: ${params.partnerName} (${params.companyName})`,
    `AM: ${params.amName}`,
  ];
  if (params.meetingFormat) {
    lines.push(`Type: ${params.meetingFormat}`);
  }
  lines.push(
    `Wanneer: ${params.date} om ${params.time}`,
    `Telefoon: ${params.phone}`,
  );
  return lines.join("\n");
}

export function formatFirstInstallNotification(params: {
  partnerName: string;
  companyName: string;
  address: string;
  preferredWeek: string;
}): string {
  return [
    `*Eerste installatie aanvraag*`,
    `Partner: ${params.partnerName} (${params.companyName})`,
    `Adres: ${params.address}`,
    `Gewenste week: ${params.preferredWeek}`,
    `@Ralph: bevestig a.u.b. via /admin dashboard`,
  ].join("\n");
}

export function formatCancelNotification(params: {
  partnerName: string;
  companyName: string;
  date: string;
  amName: string;
}): string {
  return [
    `*Kennismaking geannuleerd*`,
    `Partner: ${params.partnerName} (${params.companyName})`,
    `Was gepland op: ${params.date}`,
    `AM: ${params.amName}`,
  ].join("\n");
}

export function formatRescheduleNotification(params: {
  partnerName: string;
  companyName: string;
  oldDate: string;
  newDate: string;
  newTime: string;
  amName: string;
}): string {
  return [
    `*Kennismaking verplaatst*`,
    `Partner: ${params.partnerName} (${params.companyName})`,
    `Was: ${params.oldDate}`,
    `Nieuw: ${params.newDate} om ${params.newTime}`,
    `AM: ${params.amName}`,
  ].join("\n");
}

export function formatAutoSlotNotification(params: {
  date: string;
  spotsAvailable: number;
}): string {
  return [
    `*Nieuwe training sessie automatisch aangemaakt*`,
    `Datum: ${params.date}`,
    `Plekken: ${params.spotsAvailable} beschikbaar`,
    `Reden: vorige sessie is bijna vol`,
  ].join("\n");
}
