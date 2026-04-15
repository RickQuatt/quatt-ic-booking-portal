/**
 * GET /api/slots?date=YYYY-MM-DD&format=showroom|online
 * Returns available time slots for a given date + meeting format.
 */

import { getFreeBusy } from "../lib/google-calendar";
import { AM_CONFIG, type Env } from "../lib/types";

interface Slot {
  start: string;
  end: string;
  amEmail: string;
  amName: string;
}

const SLOT_DURATION: Record<string, number> = {
  showroom: 45,
  online: 30,
};

async function getSlotsForAm(
  env: Env,
  amEmail: string,
  amName: string,
  date: string,
  timeMin: string,
  timeMax: string,
  durationMin: number,
): Promise<Slot[]> {
  const busyData = await getFreeBusy(env, [amEmail, env.IC_CALENDAR_ID], timeMin, timeMax);
  if (!busyData) return [];

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
  const dayEnd = new Date(`${date}T17:00:00+02:00`);
  const durationMs = durationMin * 60 * 1000;
  const stepMs = 30 * 60 * 1000;

  const slots: Slot[] = [];
  let cursor = dayStart.getTime();

  while (cursor + durationMs <= dayEnd.getTime() + durationMs) {
    const slotStart = cursor;
    const slotEnd = cursor + durationMs;

    const overlaps = busyPeriods.some(
      (busy) => slotStart < busy.end.getTime() && slotEnd > busy.start.getTime(),
    );

    if (!overlaps && slotEnd <= new Date(`${date}T17:30:00+02:00`).getTime()) {
      slots.push({
        start: new Date(slotStart).toISOString(),
        end: new Date(slotEnd).toISOString(),
        amEmail,
        amName,
      });
    }

    cursor += stepMs;
  }

  return slots;
}

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  const url = new URL(context.request.url);
  const date = url.searchParams.get("date");
  const format = url.searchParams.get("format");

  if (!date || !format || !["showroom", "online"].includes(format)) {
    return Response.json(
      { error: "Missing or invalid date/format" },
      { status: 400 },
    );
  }

  // Validate date is at least 2 days from now
  const requestedDate = new Date(date + "T00:00:00");
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  minDate.setHours(0, 0, 0, 0);

  if (requestedDate < minDate) {
    return Response.json(
      { error: "Datum moet minimaal 2 dagen in de toekomst zijn" },
      { status: 400 },
    );
  }

  // Check it is a weekday
  const dayOfWeek = requestedDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return Response.json({ slots: [] });
  }

  const durationMin = SLOT_DURATION[format];
  const timeMin = `${date}T09:00:00+02:00`;
  const timeMax = `${date}T17:30:00+02:00`;

  try {
    if (format === "showroom") {
      // Ralph only for showroom visits
      const ralph = AM_CONFIG[0];
      const slots = await getSlotsForAm(
        context.env, ralph.email, ralph.name, date, timeMin, timeMax, durationMin,
      );
      return Response.json({ slots });
    }

    // Online -- both AMs
    const allSlots: Slot[] = [];
    const usedTimes = new Set<string>();

    for (const am of AM_CONFIG) {
      const amSlots = await getSlotsForAm(
        context.env, am.email, am.name, date, timeMin, timeMax, durationMin,
      );
      for (const slot of amSlots) {
        if (!usedTimes.has(slot.start)) {
          usedTimes.add(slot.start);
          allSlots.push(slot);
        }
      }
    }

    allSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return Response.json({ slots: allSlots });
  } catch (error) {
    console.error("Slots fetch error:", error);
    return Response.json(
      { error: "Kon beschikbaarheid niet ophalen" },
      { status: 500 },
    );
  }
};
