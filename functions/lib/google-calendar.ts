/**
 * Google Calendar operations via REST API v3.
 * Replaces googleapis SDK with raw fetch() for Cloudflare Workers.
 */

import { googleFetch } from "./google-auth";
import { IC_COLORS, type CalendarEventMeta, type Env } from "./types";

const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

export function buildMetaBlock(meta: CalendarEventMeta): string {
  return [
    "---IC-META---",
    `TYPE: ${meta.type}`,
    `PARTNER: ${meta.partner}`,
    `DEAL: ${meta.deal}`,
    `AM: ${meta.am}`,
    `SOURCE: ${meta.source}`,
    `PHONE: ${meta.phone}`,
    "---IC-META---",
  ].join("\n");
}

export async function createTrainingEvent(
  env: Env,
  params: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    maxCapacity: number;
  },
): Promise<string | null> {
  const body = {
    summary: `Quatt Installatie Training -- ${params.title}`,
    location: params.location,
    description: `Quatt Installatie Training\nMax deelnemers: ${params.maxCapacity}\n\nManaged by IC Booking Portal`,
    start: {
      dateTime: `${params.date}T${params.startTime}:00`,
      timeZone: "Europe/Amsterdam",
    },
    end: {
      dateTime: `${params.date}T${params.endTime}:00`,
      timeZone: "Europe/Amsterdam",
    },
    colorId: IC_COLORS.training_followup,
  };

  const res = await googleFetch(
    env,
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(env.TRAINING_CALENDAR_ID)}/events?sendUpdates=none`,
    { method: "POST", body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar event creation failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function addAttendeeToEvent(
  env: Env,
  calendarId: string,
  eventId: string,
  attendeeEmail: string,
  attendeeName: string,
): Promise<void> {
  // Get current event to preserve existing attendees
  const getRes = await googleFetch(
    env,
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
  );

  if (!getRes.ok) {
    throw new Error(`Failed to get event: ${getRes.status}`);
  }

  const event = (await getRes.json()) as {
    attendees?: { email: string; displayName?: string }[];
  };
  const currentAttendees = event.attendees || [];

  // Skip if already present
  if (currentAttendees.some((a) => a.email === attendeeEmail)) return;

  // Patch with new attendee
  await googleFetch(
    env,
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    {
      method: "PATCH",
      body: JSON.stringify({
        attendees: [
          ...currentAttendees,
          { email: attendeeEmail, displayName: attendeeName },
        ],
      }),
    },
  );
}

export async function createICEvent(
  env: Env,
  params: {
    summary: string;
    colorId: string;
    startDateTime: string;
    endDateTime: string;
    amEmail: string;
    description: string;
    location?: string;
    addGoogleMeet?: boolean;
    attendees?: string[];
    reminders?: { method: "popup" | "email"; minutes: number }[];
  },
): Promise<{ eventId: string | null; meetLink: string | null }> {
  const allAttendees = [
    { email: params.amEmail },
    ...(params.attendees || []).map((email) => ({ email })),
  ];

  const body: Record<string, unknown> = {
    summary: params.summary,
    colorId: params.colorId,
    location: params.location,
    description: params.description,
    start: {
      dateTime: params.startDateTime,
      timeZone: "Europe/Amsterdam",
    },
    end: {
      dateTime: params.endDateTime,
      timeZone: "Europe/Amsterdam",
    },
    attendees: allAttendees,
    reminders: {
      useDefault: false,
      overrides: params.reminders || [{ method: "popup", minutes: 15 }],
    },
  };

  if (params.addGoogleMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const conferenceVersion = params.addGoogleMeet ? 1 : 0;
  const res = await googleFetch(
    env,
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(env.IC_CALENDAR_ID)}/events?sendUpdates=none&conferenceDataVersion=${conferenceVersion}`,
    { method: "POST", body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IC event creation failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    id: string;
    conferenceData?: {
      entryPoints?: { entryPointType: string; uri: string }[];
    };
  };

  const meetLink =
    data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video",
    )?.uri || null;

  return { eventId: data.id, meetLink };
}

interface FreeBusyCalendar {
  busy?: { start: string; end: string }[];
}

export async function getFreeBusy(
  env: Env,
  calendarIds: string[],
  timeMin: string,
  timeMax: string,
): Promise<Record<string, FreeBusyCalendar> | null> {
  const res = await googleFetch(
    env,
    `${CALENDAR_BASE}/freeBusy`,
    {
      method: "POST",
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: "Europe/Amsterdam",
        items: calendarIds.map((id) => ({ id })),
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FreeBusy query failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    calendars: Record<string, FreeBusyCalendar>;
  };
  return data.calendars;
}

export async function findFreeSlot(
  env: Env,
  amEmail: string,
  date: string,
  durationMinutes: number,
): Promise<{ start: string; end: string } | null> {
  const timeMin = `${date}T09:00:00+02:00`;
  const timeMax = `${date}T17:30:00+02:00`;

  const busyData = await getFreeBusy(
    env,
    [amEmail, env.IC_CALENDAR_ID],
    timeMin,
    timeMax,
  );
  if (!busyData) return null;

  const busyPeriods: { start: Date; end: Date }[] = [];
  for (const calId of [amEmail, env.IC_CALENDAR_ID]) {
    const cal = busyData[calId];
    if (cal?.busy) {
      for (const period of cal.busy) {
        busyPeriods.push({
          start: new Date(period.start),
          end: new Date(period.end),
        });
      }
    }
  }

  busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

  const dayStart = new Date(`${date}T09:00:00+02:00`);
  const dayEnd = new Date(`${date}T17:30:00+02:00`);
  const durationMs = durationMinutes * 60 * 1000;

  let searchStart = dayStart;

  for (const busy of busyPeriods) {
    const gapEnd = busy.start;
    if (gapEnd.getTime() - searchStart.getTime() >= durationMs) {
      return {
        start: searchStart.toISOString(),
        end: new Date(searchStart.getTime() + durationMs).toISOString(),
      };
    }
    if (busy.end > searchStart) {
      searchStart = busy.end;
    }
  }

  if (dayEnd.getTime() - searchStart.getTime() >= durationMs) {
    return {
      start: searchStart.toISOString(),
      end: new Date(searchStart.getTime() + durationMs).toISOString(),
    };
  }

  return null;
}

/**
 * Create a TENTATIVE all-day "week hold" on the IC calendar for a first installation.
 * The partner picks a preferred week (ISO format like "2026-W18"); we put a 5-day
 * all-day block on the AM's calendar so the AM sees the request visually without
 * blocking their free/busy. The AM then replaces this with a real appointment.
 *
 * Returns null on failure (non-blocking: booking still succeeds).
 */
export async function createFirstInstallHold(
  env: Env,
  params: {
    companyName: string;
    partnerName: string;
    partnerEmail: string;
    partnerPhone: string;
    installationAddress: string;
    preferredWeek: string; // "YYYY-Www"
    amEmail: string;
    notes?: string;
  },
): Promise<string | null> {
  // Parse ISO week (e.g. "2026-W18") to Monday of that week (UTC date).
  const match = /^(\d{4})-W(\d{2})$/.exec(params.preferredWeek.trim());
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7; // treat Sunday as 7
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow + 1);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);

  const mondayStr = monday.toISOString().slice(0, 10); // YYYY-MM-DD
  const saturday = new Date(monday);
  saturday.setUTCDate(monday.getUTCDate() + 5); // exclusive end = Saturday (covers Mon-Fri)
  const saturdayStr = saturday.toISOString().slice(0, 10);

  const meta = buildMetaBlock({
    type: "first_install",
    partner: params.companyName,
    deal: "",
    am: params.amEmail,
    source: "booking-portal",
    phone: params.partnerPhone,
  });

  const description = [
    `Begeleiding bij eerste installatie door ${params.companyName}.`,
    `Contact: ${params.partnerName} -- ${params.partnerEmail} -- ${params.partnerPhone}`,
    `Locatie: ${params.installationAddress}`,
    "",
    "Dit is een TENTATIEVE week-hold. Plan een specifieke afspraak in tijdens de week en vervang dit event.",
    params.notes ? `\nOpmerking partner:\n${params.notes}` : "",
    "",
    meta,
  ].join("\n");

  const body = {
    summary: `IC First Install: ${params.companyName}`,
    location: params.installationAddress,
    description,
    start: { date: mondayStr },
    end: { date: saturdayStr },
    status: "tentative",
    transparency: "transparent", // does not block free/busy
    colorId: IC_COLORS.first_install,
    attendees: [{ email: params.amEmail }, { email: params.partnerEmail, displayName: params.partnerName }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup" as const, minutes: 48 * 60 }, // 2 days before
      ],
    },
  };

  try {
    const res = await googleFetch(
      env,
      `${CALENDAR_BASE}/calendars/${encodeURIComponent(env.IC_CALENDAR_ID)}/events?sendUpdates=none`,
      { method: "POST", body: JSON.stringify(body) },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`First install hold event creation failed (${res.status}): ${text}`);
      return null;
    }

    const data = (await res.json()) as { id: string };
    return data.id;
  } catch (e) {
    console.error("First install hold event creation threw:", e);
    return null;
  }
}

/**
 * List upcoming events from a calendar. Returns singleEvents (expanded recurrences),
 * orderBy=startTime, from now to `daysAhead` in the future.
 */
export interface CalendarEventSummary {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string; // ISO datetime (or YYYY-MM-DDT00:00:00 if all-day)
  end: string; // ISO datetime (or YYYY-MM-DDT23:59:59 if all-day)
  status: "confirmed" | "tentative" | "cancelled";
  attendeeCount: number;
  /** True when the Google event used start.date / end.date (no specific time). */
  isAllDay: boolean;
}

export async function listUpcomingEvents(
  env: Env,
  calendarId: string,
  daysAhead = 90,
): Promise<CalendarEventSummary[]> {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const res = await googleFetch(
    env,
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar list failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      description?: string;
      location?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      status?: string;
      attendees?: Array<{ email?: string }>;
    }>;
  };

  return (data.items || [])
    .filter((e) => e.start?.dateTime || e.start?.date)
    .map((e) => {
      const isAllDay = !e.start?.dateTime && !!e.start?.date;
      return {
        id: e.id,
        summary: e.summary || "(untitled)",
        description: e.description,
        location: e.location,
        start: e.start?.dateTime || `${e.start?.date}T00:00:00`,
        end: e.end?.dateTime || `${e.end?.date}T23:59:59`,
        status: (e.status as CalendarEventSummary["status"]) || "confirmed",
        attendeeCount: e.attendees?.length || 0,
        isAllDay,
      };
    });
}

export async function deleteCalendarEvent(
  env: Env,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const res = await googleFetch(
    env,
    `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    { method: "DELETE" },
  );

  if (!res.ok && res.status !== 410) {
    // 410 Gone = already deleted, that's fine
    const text = await res.text();
    throw new Error(`Calendar event deletion failed (${res.status}): ${text}`);
  }
}
