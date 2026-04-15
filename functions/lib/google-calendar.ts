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
