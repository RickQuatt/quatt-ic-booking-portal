/**
 * GET  /api/bookings -- list bookings (unused publicly, kept for completeness)
 * POST /api/bookings -- create a new booking
 */

import { getSupabase } from "../../lib/supabase";
import {
  addAttendeeToEvent,
  createICEvent,
  getFreeBusy,
  buildMetaBlock,
} from "../../lib/google-calendar";
import { IC_COLORS, AM_CONFIG, type Env } from "../../lib/types";
import { appendBookingRow } from "../../lib/google-sheets";
import {
  sendSlackNotification,
  formatTrainingBookingNotification,
  formatIntroCallNotification,
  formatFirstInstallNotification,
} from "../../lib/slack";
import {
  setKennismakingBooked,
  setTrainingBooked,
} from "../../lib/hubspot-forms";
import { postWalleosBooking } from "../../lib/walleos";
import { signBookingAction } from "../../lib/booking-tokens";
import {
  sendKennismakingConfirmation,
  sendSiteVisitConfirmation,
  sendTrainingConfirmation,
  sendFirstInstallConfirmation,
} from "../../lib/email";
import {
  rateLimit,
  rateLimitResponse,
  originMatchesHost,
} from "../../lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  const { env, request } = context;

  if (!originMatchesHost(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const rl = await rateLimit(env.RATE_LIMIT, request, {
    bucket: "bookings",
    max: 5,
    windowSeconds: 600, // 5 bookings per IP per 10 min
  });
  if (!rl.ok) return rateLimitResponse(rl);

  const body = await context.request.json() as Record<string, unknown>;
  const { type } = body;

  if (!type || !["training", "intro_call", "first_install"].includes(type as string)) {
    return Response.json({ error: "Invalid booking type" }, { status: 400 });
  }

  if (body.partnerEmail && !EMAIL_REGEX.test(body.partnerEmail as string)) {
    return Response.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  try {
    if (type === "training") return await handleTrainingBooking(env, body);
    if (type === "intro_call") return await handleIntroCallBooking(env, body);
    if (type === "first_install") return await handleFirstInstallBooking(env, body);
  } catch (error) {
    console.error("Booking error:", error);
    return Response.json(
      { error: "Booking failed. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ error: "Unknown error" }, { status: 500 });
};

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

async function handleTrainingBooking(env: Env, body: Record<string, unknown>) {
  const { sessionId, partnerName, partnerEmail, partnerPhone, companyName, kvkNumber, notes } = body as {
    sessionId: string; partnerName: string; partnerEmail: string; partnerPhone: string;
    companyName: string; kvkNumber?: string; notes?: string;
  };

  if (!sessionId || !partnerName || !partnerEmail || !partnerPhone || !companyName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabase(env);

  // Get session
  const { data: session } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return Response.json({ error: "Training session not found" }, { status: 404 });
  }

  if (session.status !== "open") {
    return Response.json({ error: "Training session is not open for bookings" }, { status: 400 });
  }

  const currentCount = session.current_bookings ?? 0;
  const maxCapacity = session.max_capacity ?? 8;

  if (currentCount >= maxCapacity) {
    return Response.json({ error: "Training session is full" }, { status: 400 });
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("bookings")
    .select("id, partner_email, status")
    .eq("session_id", sessionId);

  const isDuplicate = (existing || []).some(
    (b) => b.partner_email === partnerEmail && b.status !== "cancelled",
  );

  if (isDuplicate) {
    return Response.json(
      { error: "You have already booked this training session" },
      { status: 400 },
    );
  }

  // Insert booking
  const { data: booking, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      type: "training",
      session_id: sessionId,
      partner_name: partnerName,
      partner_email: partnerEmail,
      partner_phone: partnerPhone,
      company_name: companyName,
      kvk_number: kvkNumber || null,
      notes: notes || null,
      status: "confirmed",
      assigned_am: "mitchell.k@quatt.io",
    })
    .select()
    .single();

  if (insertErr || !booking) {
    console.error("Insert error:", insertErr);
    return Response.json({ error: "Booking failed" }, { status: 500 });
  }

  // Increment session count
  await supabase
    .from("training_sessions")
    .update({
      current_bookings: currentCount + 1,
      status: currentCount + 1 >= maxCapacity ? "full" : "open",
    })
    .eq("id", sessionId);

  // Add attendee to calendar (non-blocking)
  if (session.calendar_event_id) {
    addAttendeeToEvent(
      env, env.TRAINING_CALENDAR_ID, session.calendar_event_id, partnerEmail, partnerName,
    ).catch((e) => console.error("Calendar attendee add failed:", e));
  }

  // HubSpot: flip ic__training_booked + legacy_date_of_first_appointment_booked (non-blocking)
  setTrainingBooked(env, partnerEmail, undefined, session.date).catch((e) =>
    console.error("HubSpot training-booked push failed:", e),
  );

  // Wall-E OS milestone (non-blocking, feature-flagged off until env is set)
  postWalleosBooking(env, {
    event_id: `booking-training-${booking?.id ?? session.id}`,
    event_type: "training_booked",
    partner_email: partnerEmail,
    session: {
      session_id: String(session.id),
      start_at: session.date,
      url: session.calendar_event_url ?? undefined,
      host: "Mitchell van Kleef",
    },
  }).catch((e) => console.error("Wall-E OS training-booked push failed:", e));

  // Write to Google Sheet (non-blocking)
  appendBookingRow(env, {
    type: "training",
    partnerName,
    email: partnerEmail,
    phone: partnerPhone,
    company: companyName,
    date: session.date,
    am: "Mitchell van Kleef",
    status: "confirmed",
    hubspotDealId: "",
  })
    .then((rowId) => {
      if (rowId && booking.id) {
        supabase
          .from("bookings")
          .update({ sheet_row_id: rowId })
          .eq("id", booking.id)
          .then(() => {});
      }
    })
    .catch((e) => console.error("Sheet write failed:", e));

  // Slack (non-blocking)
  sendSlackNotification(
    env,
    formatTrainingBookingNotification({
      partnerName,
      companyName,
      trainingDate: `${session.date} ${session.start_time}`,
      spotsRemaining: maxCapacity - (currentCount + 1),
      totalSpots: maxCapacity,
    }),
  ).catch((e) => console.error("Slack notification failed:", e));

  // Confirmation email (non-blocking)
  sendTrainingConfirmation(env, {
    to: partnerEmail,
    partnerName,
    sessionDate: session.date,
    sessionTime: `${session.start_time} - ${session.end_time}`,
    location: session.location || "",
  }).catch((e) => console.error("Training confirmation email failed:", e));

  return Response.json({
    success: true,
    booking: {
      id: booking.id,
      sessionDate: session.date,
      sessionTime: `${session.start_time} - ${session.end_time}`,
      location: session.location,
    },
  });
}

// ---------------------------------------------------------------------------
// Intro call (kennismaking)
// ---------------------------------------------------------------------------

async function handleIntroCallBooking(env: Env, body: Record<string, unknown>) {
  const {
    partnerName, partnerEmail, partnerPhone, companyName, kvkNumber,
    meetingFormat, slotStart, slotEnd, amEmail, location, notes, hubspotDealId,
    preferredDate, preferredTimeSlot,
  } = body as {
    partnerName: string; partnerEmail: string; partnerPhone: string; companyName: string;
    kvkNumber?: string; meetingFormat?: string; slotStart?: string; slotEnd?: string;
    amEmail?: string; location?: string; notes?: string; hubspotDealId?: string;
    preferredDate?: string; preferredTimeSlot?: string;
  };

  if (!partnerName || !partnerEmail || !partnerPhone || !companyName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const formatLabels: Record<string, string> = {
    showroom: "Showroom bezoek (Kon. Wilhelminaplein 29, Amsterdam)",
    online: "Online videogesprek (Google Meet)",
    site_visit: `Terugbelverzoek${location ? ` - ${location}` : ""}`,
  };

  const supabase = getSupabase(env);

  // --- Calendar-booked flow (showroom / online) ---
  if ((meetingFormat === "showroom" || meetingFormat === "online") && slotStart && slotEnd && amEmail) {
    // Verify slot is still free
    const busyData = await getFreeBusy(env, [amEmail, env.IC_CALENDAR_ID], slotStart, slotEnd);
    const isBusy = [amEmail, env.IC_CALENDAR_ID].some((calId) => {
      const cal = busyData?.[calId];
      return cal?.busy && cal.busy.length > 0;
    });

    if (isBusy) {
      return Response.json(
        { error: "Dit tijdslot is helaas net geboekt. Kies een ander moment." },
        { status: 409 },
      );
    }

    const am = AM_CONFIG.find((a) => a.email === amEmail) || AM_CONFIG[0];

    const isOnline = meetingFormat === "online";
    const eventLocation = isOnline ? undefined : "Kon. Wilhelminaplein 29, 1062HJ Amsterdam";
    const summary = isOnline
      ? `Kennismaking - ${companyName}`
      : `Showroom bezoek - ${companyName}`;

    const meta = buildMetaBlock({
      type: meetingFormat,
      partner: companyName,
      deal: hubspotDealId || "",
      am: am.name,
      source: "booking-portal",
      phone: partnerPhone,
    });

    const description = [meta, notes ? `\nOpmerkingen: ${notes}` : ""].join("");

    const calResult = await createICEvent(env, {
      summary,
      colorId: IC_COLORS.intro_call,
      startDateTime: slotStart,
      endDateTime: slotEnd,
      amEmail: am.email,
      description,
      location: eventLocation,
      addGoogleMeet: isOnline,
      attendees: [partnerEmail],
    });

    const formatNote = `[${formatLabels[meetingFormat]}]`;
    const combinedNotes = [formatNote, notes].filter(Boolean).join("\n") || null;

    const { data: booking, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        type: "intro_call",
        partner_name: partnerName,
        partner_email: partnerEmail,
        partner_phone: partnerPhone,
        company_name: companyName,
        kvk_number: kvkNumber || null,
        preferred_date: slotStart.split("T")[0],
        preferred_time_slot: new Date(slotStart).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }),
        location: eventLocation || null,
        notes: combinedNotes,
        status: "confirmed",
        calendar_event_id: calResult.eventId,
        assigned_am: am.email,
        hubspot_deal_id: hubspotDealId || null,
      })
      .select()
      .single();

    if (insertErr || !booking) {
      console.error("Insert error:", insertErr);
      return Response.json({ error: "Booking failed" }, { status: 500 });
    }

    // HubSpot (non-blocking)
    setKennismakingBooked(env, partnerEmail, hubspotDealId, slotStart.split("T")[0]).catch((e) =>
      console.error("HubSpot Forms API failed:", e),
    );

    // Wall-E OS milestone (non-blocking, feature-flagged off until env is set)
    postWalleosBooking(env, {
      event_id: `booking-kennismaking-${booking.id}`,
      event_type: "kennismaking_booked",
      partner_email: partnerEmail,
      hubspot_deal_id: hubspotDealId || undefined,
      session: {
        session_id: String(booking.id),
        start_at: slotStart,
        host: am.name,
      },
    }).catch((e) => console.error("Wall-E OS kennismaking-booked push failed:", e));

    // Google Sheet (non-blocking)
    appendBookingRow(env, {
      type: "intro_call",
      partnerName,
      email: partnerEmail,
      phone: partnerPhone,
      company: companyName,
      date: slotStart.split("T")[0],
      am: am.name,
      status: "confirmed",
      hubspotDealId: "",
    })
      .then((rowId) => {
        if (rowId && booking.id) {
          supabase.from("bookings").update({ sheet_row_id: rowId }).eq("id", booking.id).then(() => {});
        }
      })
      .catch((e) => console.error("Sheet write failed:", e));

    // Slack (non-blocking)
    const slotTime = new Date(slotStart).toLocaleString("nl-NL", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
    });
    sendSlackNotification(
      env,
      formatIntroCallNotification({
        partnerName, companyName, amName: am.name,
        date: slotStart.split("T")[0], time: slotTime,
        phone: partnerPhone, meetingFormat: formatLabels[meetingFormat],
      }),
    ).catch((e) => console.error("Slack notification failed:", e));

    // Generate tokens for reschedule/cancel links
    let rescheduleToken: string | undefined;
    let cancelToken: string | undefined;
    try {
      rescheduleToken = await signBookingAction(env.BOOKING_SECRET, booking.id, partnerEmail, "reschedule");
      cancelToken = await signBookingAction(env.BOOKING_SECRET, booking.id, partnerEmail, "cancel");
    } catch (e) {
      console.error("Token generation failed (BOOKING_SECRET missing?):", e);
    }

    // Confirmation email (non-blocking)
    sendKennismakingConfirmation(env, {
      to: partnerEmail, partnerName, companyName, amName: am.name,
      date: slotStart.split("T")[0], startTime: slotStart, endTime: slotEnd,
      meetingFormat: meetingFormat as "showroom" | "online",
      location: eventLocation, meetLink: calResult.meetLink,
      bookingId: booking.id, rescheduleToken, cancelToken,
    }).catch((e) => console.error("Kennismaking confirmation email failed:", e));

    return Response.json({
      success: true,
      booking: {
        id: booking.id, assignedAm: am.name, slotStart, slotEnd,
        meetLink: calResult.meetLink, location: eventLocation, status: "confirmed",
      },
    });
  }

  // --- Callback flow (site_visit or legacy intro_call) ---
  if (!preferredDate) {
    return Response.json({ error: "Missing preferred date" }, { status: 400 });
  }

  // Round-robin AM assignment
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("type", "intro_call");

  const amIndex = (count || 0) % AM_CONFIG.length;
  const assignedAm = AM_CONFIG[amIndex];

  const formatNote = meetingFormat ? `[${formatLabels[meetingFormat]}]` : "";
  const combinedNotes = [formatNote, notes].filter(Boolean).join("\n") || null;

  const { data: booking, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      type: "intro_call",
      partner_name: partnerName,
      partner_email: partnerEmail,
      partner_phone: partnerPhone,
      company_name: companyName,
      kvk_number: kvkNumber || null,
      preferred_date: preferredDate,
      preferred_time_slot: preferredTimeSlot || null,
      location: location || null,
      notes: combinedNotes,
      status: "pending_am_confirmation",
      assigned_am: assignedAm.email,
      hubspot_deal_id: hubspotDealId || null,
    })
    .select()
    .single();

  if (insertErr || !booking) {
    console.error("Insert error:", insertErr);
    return Response.json({ error: "Booking failed" }, { status: 500 });
  }

  // HubSpot (non-blocking)
  setKennismakingBooked(env, partnerEmail, hubspotDealId, preferredDate).catch((e) =>
    console.error("HubSpot Forms API failed:", e),
  );

  // Wall-E OS milestone (non-blocking, feature-flagged off until env is set)
  postWalleosBooking(env, {
    event_id: `booking-kennismaking-${booking.id}`,
    event_type: "kennismaking_booked",
    partner_email: partnerEmail,
    hubspot_deal_id: hubspotDealId || undefined,
    session: {
      session_id: String(booking.id),
      start_at: `${preferredDate}T09:00:00Z`, // time slot not resolved yet
      host: assignedAm.name,
    },
  }).catch((e) => console.error("Wall-E OS kennismaking-booked push failed:", e));

  // Google Sheet (non-blocking)
  appendBookingRow(env, {
    type: "intro_call", partnerName, email: partnerEmail, phone: partnerPhone,
    company: companyName, date: preferredDate, am: assignedAm.name,
    status: "pending_am_confirmation", hubspotDealId: "",
  })
    .then((rowId) => {
      if (rowId && booking.id) {
        supabase.from("bookings").update({ sheet_row_id: rowId }).eq("id", booking.id).then(() => {});
      }
    })
    .catch((e) => console.error("Sheet write failed:", e));

  // Slack (non-blocking)
  const formatLabel = meetingFormat ? formatLabels[meetingFormat] : "Intro call";
  sendSlackNotification(
    env,
    formatIntroCallNotification({
      partnerName, companyName, amName: assignedAm.name,
      date: preferredDate, time: preferredTimeSlot || "n.t.b.",
      phone: partnerPhone, meetingFormat: formatLabel,
    }),
  ).catch((e) => console.error("Slack notification failed:", e));

  // Confirmation email for site visits (non-blocking)
  if (meetingFormat === "site_visit" && location) {
    sendSiteVisitConfirmation(env, {
      to: partnerEmail, partnerName, companyName,
      amName: assignedAm.name, location,
    }).catch((e) => console.error("Site visit confirmation email failed:", e));
  }

  return Response.json({
    success: true,
    booking: {
      id: booking.id, assignedAm: assignedAm.name,
      preferredDate, status: "pending_am_confirmation",
    },
  });
}

// ---------------------------------------------------------------------------
// First install
// ---------------------------------------------------------------------------

async function handleFirstInstallBooking(env: Env, body: Record<string, unknown>) {
  const {
    partnerName, partnerEmail, partnerPhone, companyName,
    kvkNumber, installationAddress, preferredWeek, notes,
  } = body as {
    partnerName: string; partnerEmail: string; partnerPhone: string; companyName: string;
    kvkNumber?: string; installationAddress: string; preferredWeek: string; notes?: string;
  };

  if (!partnerName || !partnerEmail || !partnerPhone || !companyName || !installationAddress || !preferredWeek) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const assignedAm = AM_CONFIG[0]; // Ralph
  const supabase = getSupabase(env);

  const { data: booking, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      type: "first_install",
      partner_name: partnerName,
      partner_email: partnerEmail,
      partner_phone: partnerPhone,
      company_name: companyName,
      kvk_number: kvkNumber || null,
      preferred_date: preferredWeek,
      location: installationAddress,
      notes: notes || null,
      status: "pending_am_confirmation",
      assigned_am: assignedAm.email,
    })
    .select()
    .single();

  if (insertErr || !booking) {
    console.error("Insert error:", insertErr);
    return Response.json({ error: "Booking failed" }, { status: 500 });
  }

  // Google Sheet (non-blocking)
  appendBookingRow(env, {
    type: "first_install", partnerName, email: partnerEmail, phone: partnerPhone,
    company: companyName, date: preferredWeek, am: assignedAm.name,
    status: "pending_am_confirmation", hubspotDealId: "",
  })
    .then((rowId) => {
      if (rowId && booking.id) {
        supabase.from("bookings").update({ sheet_row_id: rowId }).eq("id", booking.id).then(() => {});
      }
    })
    .catch((e) => console.error("Sheet write failed:", e));

  // Slack (non-blocking)
  sendSlackNotification(
    env,
    formatFirstInstallNotification({
      partnerName, companyName, address: installationAddress, preferredWeek,
    }),
  ).catch((e) => console.error("Slack notification failed:", e));

  // Confirmation email (non-blocking)
  sendFirstInstallConfirmation(env, {
    to: partnerEmail, partnerName, amName: assignedAm.name,
    address: installationAddress, preferredWeek,
  }).catch((e) => console.error("First install confirmation email failed:", e));

  return Response.json({
    success: true,
    booking: {
      id: booking.id,
      status: "pending_am_confirmation",
      assignedAm: assignedAm.name,
    },
  });
}
