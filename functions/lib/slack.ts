/**
 * Slack notifications via Bot token.
 * Already uses fetch() -- works in Cloudflare Workers as-is.
 */

import type { Env } from "./types";

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
