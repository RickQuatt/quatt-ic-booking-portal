/**
 * GET  /api/bookings -- list bookings (unused publicly, kept for completeness)
 * POST /api/bookings -- create a new booking (training / intro_call / first_install)
 *
 * Storage: Cloudflare D1 (see migrations/d1/0002_bookings_training.sql).
 * Supabase is no longer touched from this file -- it lives only as a read-only
 * archive of pre-migration data.
 */

import {
  addAttendeeToEvent,
  createICEvent,
  createTrainingEvent,
  createFirstInstallHold,
  ensureTrainingCoreAttendees,
  getFreeBusy,
  buildMetaBlock,
} from "../../lib/google-calendar";
import { IC_COLORS, AM_CONFIG, type Env, type TrainingTrack } from "../../lib/types";
import { appendBookingRow } from "../../lib/google-sheets";
import {
  sendSlackNotification,
  formatTrainingBookingNotification,
  formatIntroCallNotification,
  formatFirstInstallNotification,
  alertOnFailure,
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
import {
  countBookingsByType,
  getSessionById,
  incrementSessionBookings,
  insertBooking,
  updateBookingCalendar,
  updateBookingSheetRow,
} from "../../lib/d1-bookings";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}) => {
  const { env, request, waitUntil } = context;

  if (!originMatchesHost(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const rl = await rateLimit(env.RATE_LIMIT, request, {
    bucket: "bookings",
    // Loosened 2026-06-03 (5 -> 20) -- multi-attendee company bookings + AM-
    // initiated batch flows were hitting the cap. 20/10min still blocks
    // scripted floods. Watch wall-e-alerts for spikes; tighten if abuse shows.
    max: 20,
    windowSeconds: 600,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  const body = (await context.request.json()) as Record<string, unknown>;
  const { type } = body;

  if (!type || !["training", "intro_call", "first_install"].includes(type as string)) {
    return Response.json({ error: "Invalid booking type" }, { status: 400 });
  }

  if (body.partnerEmail && !EMAIL_REGEX.test(body.partnerEmail as string)) {
    return Response.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  // Test-mode short-circuit: ?test=1 returns a fake success WITHOUT writing anywhere.
  const isTest = new URL(request.url).searchParams.get("test") === "1";
  if (isTest) {
    return Response.json({
      success: true,
      test: true,
      booking: {
        id: "test-booking-id",
        sessionDate: type === "training" ? "vrijdag 1 januari 2027" : undefined,
        sessionTime: type === "training" ? "09:00 - 12:00" : undefined,
        location: "Quatt HQ, Amsterdam",
        assignedAm: "Ralph",
        slotStart: new Date(Date.now() + 86400000).toISOString(),
        slotEnd: new Date(Date.now() + 86400000 + 30 * 60000).toISOString(),
        status: "confirmed",
        meetLink: "https://meet.google.com/test-test-test",
      },
    });
  }

  if (!env.DB) {
    console.error("D1 binding missing");
    return Response.json(
      { error: "Opslag is tijdelijk niet beschikbaar." },
      { status: 503 },
    );
  }

  // Phase 5b walleos PULL gates. Soft-fail: if walleos is unreachable
  // we permit the action (fail-open) so the portal can never be DoS'd
  // by a walleos outage.
  //   - first_install: require training_completed_at
  // intro_call + training have no prerequisite -- both are open entry points
  // (training gate removed 2026-06-03 per Rick: cold prospects + lapsed
  // partners must be able to book trainings without first signing the
  // agreement; the agreement gate now lives at a later step).
  const gateEmail =
    typeof (body as Record<string, unknown>)?.partnerEmail === "string"
      ? ((body as Record<string, unknown>).partnerEmail as string)
      : typeof (body as Record<string, unknown>)?.email === "string"
        ? ((body as Record<string, unknown>).email as string)
        : null;
  if (gateEmail && type === "first_install") {
    try {
      const { resolvePartnerByEmail } = await import("../../lib/walleos-pull");
      const state = await resolvePartnerByEmail(env, gateEmail);
      if (state && !state.training_completed_at) {
        return Response.json(
          {
            error: "training_required",
            detail:
              "Je moet de installatietraining hebben afgerond voordat je een eerste installatie boekt.",
            training_url: "/book/training",
          },
          { status: 409 },
        );
      }
    } catch (err) {
      console.warn(
        `[bookings] walleos gate skipped (fail-open) for ${gateEmail}: ${(err as Error).message}`,
      );
    }
  }

  try {
    if (type === "training") return await handleTrainingBooking(env, body, waitUntil);
    if (type === "intro_call") return await handleIntroCallBooking(env, body, waitUntil);
    if (type === "first_install") return await handleFirstInstallBooking(env, body, waitUntil);
  } catch (error) {
    console.error("Booking error:", error);
    return Response.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }

  return Response.json({ error: "Unknown error" }, { status: 500 });
};

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

async function handleTrainingBooking(
  env: Env,
  body: Record<string, unknown>,
  waitUntil: (p: Promise<unknown>) => void,
) {
  const { sessionId, partnerName, partnerEmail, partnerPhone, companyName, kvkNumber, notes, dealId } =
    body as {
      sessionId: string;
      partnerName: string;
      partnerEmail: string;
      partnerPhone: string;
      companyName: string;
      kvkNumber?: string;
      notes?: string;
      dealId?: string;
    };

  if (!sessionId || !partnerName || !partnerEmail || !partnerPhone || !companyName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // (Agreement gate removed 2026-06-03 -- training is now an open entry
  // point. Cold prospects who land here become tracked leads via the
  // walleos `training_booked` webhook downstream of insertBooking.)

  // Resolve which AM owns this booking. 3-step routing: existing AM in
  // walleos -> specific-partner override -> round-robin Mitchell/Ralph.
  // The result drives the Resend From + Reply-To, the D1 assigned_am
  // column, the walleos host field, the Slack notification, and the
  // Google Sheet `am` column. See functions/lib/am-assignment.ts.
  let amAssignment;
  try {
    const { resolveAmForBooking } = await import("../../lib/am-assignment");
    const { resolvePartnerByEmail } = await import("../../lib/walleos-pull");
    const partnerState = await resolvePartnerByEmail(env, partnerEmail).catch(() => null);
    amAssignment = await resolveAmForBooking(env, {
      companyName,
      kvkNumber,
      partnerState,
    });
  } catch (err) {
    console.warn(
      `[bookings] AM resolution fell back to default for ${partnerEmail}: ${(err as Error).message}`,
    );
    const fallback = AM_CONFIG[0];
    amAssignment = { amEmail: fallback.email, amName: fallback.name, source: "fallback" as const };
  }
  console.log(
    `[bookings] AM resolved: email=${amAssignment.amEmail} source=${amAssignment.source} partner=${partnerEmail} company=${companyName}`,
  );

  const session = await getSessionById(env, sessionId);
  if (!session) {
    return Response.json({ error: "Training session not found" }, { status: 404 });
  }
  if (session.status !== "open") {
    return Response.json(
      { error: "Training session is not open for bookings" },
      { status: 400 },
    );
  }
  if (session.current_bookings >= session.max_capacity) {
    return Response.json({ error: "Training session is full" }, { status: 400 });
  }

  // Duplicate-per-session-email check removed 2026-06-03. A single email
  // (typically the partner's shared inbox) can now book N attendees on the
  // same session -- one D1 row per attendee, partnerName distinguishes them.
  // Calendar invites and confirmation emails all land at the shared inbox.

  const booking = await insertBooking(env, {
    type: "training",
    session_id: sessionId,
    partner_name: partnerName,
    partner_email: partnerEmail,
    partner_phone: partnerPhone,
    company_name: companyName,
    kvk_number: kvkNumber || null,
    notes: notes || null,
    status: "confirmed",
    assigned_am: amAssignment.amEmail,
  });

  await incrementSessionBookings(env, sessionId);

  // Track-aware calendar routing. Each track has its own Google Calendar:
  //   hybrid -> env.TRAINING_CALENDAR_ID
  //   alle   -> env.ALLE_TRAINING_CALENDAR_ID
  // Sessions on the All-e calendar are tagged track='alle' by the sync route.
  const sessionTrack = (session.track as TrainingTrack) || "hybrid";
  const trackCalendarId =
    sessionTrack === "alle" && env.ALLE_TRAINING_CALENDAR_ID
      ? env.ALLE_TRAINING_CALENDAR_ID
      : env.TRAINING_CALENDAR_ID;
  const trackTitlePrefix =
    sessionTrack === "alle" ? "All-e Installatietraining" : "Quatt Installatie Training";

  // Calendar sync. The session may be EITHER:
  //   1. A real (calendar-backed) session -- just attach partner as attendee.
  //   2. A virtual session created by sync when Rick removed a "Block" from the
  //      track's calendar. No event exists yet -> create one, then attach.
  // For real events we ALSO idempotently ensure Ralph/Mitchell/Rick + Quatt
  // Lab room are on the event, in case the calendar entry was created by hand
  // without them.
  if (session.calendar_event_id) {
    const eventId = session.calendar_event_id;
    waitUntil(
      alertOnFailure(
        env,
        "Core training attendee backfill",
        ensureTrainingCoreAttendees(env, trackCalendarId, eventId),
      ),
    );
    waitUntil(
      alertOnFailure(
        env,
        "Calendar attendee add (training)",
        addAttendeeToEvent(env, trackCalendarId, eventId, partnerEmail, partnerName),
      ),
    );
  } else {
    waitUntil(
      alertOnFailure(
        env,
        "Lazy training calendar event creation",
        (async () => {
          const newEventId = await createTrainingEvent(env, {
            title: session.title,
            date: session.date,
            startTime: session.start_time,
            endTime: session.end_time,
            location: session.location,
            maxCapacity: session.max_capacity,
            calendarId: trackCalendarId,
            titlePrefix: trackTitlePrefix,
          });
          if (newEventId) {
            await env.DB!.prepare(
              `UPDATE training_sessions SET calendar_event_id = ?, updated_at = datetime('now') WHERE id = ?`,
            )
              .bind(newEventId, sessionId)
              .run();
            await addAttendeeToEvent(
              env,
              trackCalendarId,
              newEventId,
              partnerEmail,
              partnerName,
            );
          }
        })(),
      ),
    );
  }

  // HubSpot: flip ic__training_booked. ctx.waitUntil keeps the worker alive
  // until the POST settles -- without it CF Pages may terminate the function
  // after Response is returned and the submission silently drops.
  waitUntil(
    alertOnFailure(
      env,
      "HubSpot training-booked (public booking)",
      setTrainingBooked(env, partnerEmail, undefined, session.date, sessionTrack),
    ),
  );

  // Wall-E OS milestone
  waitUntil(
    alertOnFailure(
      env,
      "Wall-E OS training_booked push",
      postWalleosBooking(env, {
        event_id: `booking-training-${booking.id}`,
        event_type: "training_booked",
        partner_email: partnerEmail,
        session: {
          session_id: String(session.id),
          start_at: session.date,
          host: amAssignment.amName,
          product_line: sessionTrack === "alle" ? "all_e" : "quatt_heat_pump",
        },
      }),
    ),
  );

  // Google Sheet
  waitUntil(
    alertOnFailure(
      env,
      "Bookings sheet append (training)",
      appendBookingRow(env, {
        type: "training",
        partnerName,
        email: partnerEmail,
        phone: partnerPhone,
        company: companyName,
        date: session.date,
        am: amAssignment.amName,
        status: "confirmed",
        hubspotDealId: "",
      }).then((rowId) => {
        if (rowId) return updateBookingSheetRow(env, booking.id, rowId);
      }),
    ),
  );

  // Slack booking notification (operational channel, separate from alerts)
  waitUntil(
    alertOnFailure(
      env,
      "Slack training-booked notification",
      sendSlackNotification(
        env,
        formatTrainingBookingNotification({
          partnerName,
          companyName,
          trainingDate: `${session.date} ${session.start_time}`,
          spotsRemaining: Math.max(0, session.max_capacity - session.current_bookings - 1),
          totalSpots: session.max_capacity,
        }),
      ),
    ),
  );

  // Confirmation email
  waitUntil(
    alertOnFailure(
      env,
      "Training confirmation email",
      sendTrainingConfirmation(env, {
        to: partnerEmail,
        partnerName,
        sessionDate: session.date,
        sessionTime: `${session.start_time} - ${session.end_time}`,
        location: session.location || "",
        amName: amAssignment.amName,
        amEmail: amAssignment.amEmail,
      }),
    ),
  );

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

async function handleIntroCallBooking(
  env: Env,
  body: Record<string, unknown>,
  waitUntil: (p: Promise<unknown>) => void,
) {
  const {
    partnerName,
    partnerEmail,
    partnerPhone,
    companyName,
    kvkNumber,
    meetingFormat,
    slotStart,
    slotEnd,
    amEmail,
    location,
    notes,
    hubspotDealId,
    preferredDate,
    preferredTimeSlot,
  } = body as {
    partnerName: string;
    partnerEmail: string;
    partnerPhone: string;
    companyName: string;
    kvkNumber?: string;
    meetingFormat?: string;
    slotStart?: string;
    slotEnd?: string;
    amEmail?: string;
    location?: string;
    notes?: string;
    hubspotDealId?: string;
    preferredDate?: string;
    preferredTimeSlot?: string;
  };

  if (!partnerName || !partnerEmail || !partnerPhone || !companyName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const formatLabels: Record<string, string> = {
    showroom: "Showroom bezoek (Kon. Wilhelminaplein 29, Amsterdam)",
    online: "Online videogesprek (Google Meet)",
    site_visit: `Terugbelverzoek${location ? ` - ${location}` : ""}`,
  };

  // --- Calendar-booked flow (showroom / online) ---
  if (
    (meetingFormat === "showroom" || meetingFormat === "online") &&
    slotStart &&
    slotEnd &&
    amEmail
  ) {
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

    const booking = await insertBooking(env, {
      type: "intro_call",
      partner_name: partnerName,
      partner_email: partnerEmail,
      partner_phone: partnerPhone,
      company_name: companyName,
      kvk_number: kvkNumber || null,
      preferred_date: slotStart.split("T")[0],
      preferred_time_slot: new Date(slotStart).toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Amsterdam",
      }),
      location: eventLocation || null,
      notes: combinedNotes,
      status: "confirmed",
      calendar_event_id: calResult.eventId,
      assigned_am: am.email,
      hubspot_deal_id: hubspotDealId || null,
      meeting_format: meetingFormat,
    });

    // HubSpot
    waitUntil(
      alertOnFailure(
        env,
        "HubSpot kennismaking-booked (kalender slot)",
        setKennismakingBooked(env, partnerEmail, hubspotDealId, slotStart.split("T")[0]),
      ),
    );

    // Wall-E OS milestone
    waitUntil(
      alertOnFailure(
        env,
        "Wall-E OS kennismaking_booked push",
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
        }),
      ),
    );

    // Google Sheet
    waitUntil(
      alertOnFailure(
        env,
        "Bookings sheet append (intro_call)",
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
        }).then((rowId) => {
          if (rowId) return updateBookingSheetRow(env, booking.id, rowId);
        }),
      ),
    );

    // Slack
    const slotTime = new Date(slotStart).toLocaleString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Amsterdam",
    });
    waitUntil(
      alertOnFailure(
        env,
        "Slack intro-call notification",
        sendSlackNotification(
          env,
          formatIntroCallNotification({
            partnerName,
            companyName,
            amName: am.name,
            date: slotStart.split("T")[0],
            time: slotTime,
            phone: partnerPhone,
            meetingFormat: formatLabels[meetingFormat],
          }),
        ),
      ),
    );

    // Tokens for reschedule/cancel links
    let rescheduleToken: string | undefined;
    let cancelToken: string | undefined;
    try {
      rescheduleToken = await signBookingAction(
        env.BOOKING_SECRET,
        booking.id,
        partnerEmail,
        "reschedule",
      );
      cancelToken = await signBookingAction(
        env.BOOKING_SECRET,
        booking.id,
        partnerEmail,
        "cancel",
      );
    } catch (e) {
      console.error("Token generation failed (BOOKING_SECRET missing?):", e);
    }

    // Confirmation email
    waitUntil(
      alertOnFailure(
        env,
        "Kennismaking confirmation email",
        sendKennismakingConfirmation(env, {
          to: partnerEmail,
          partnerName,
          companyName,
          amName: am.name,
          date: slotStart.split("T")[0],
          startTime: slotStart,
          endTime: slotEnd,
          meetingFormat: meetingFormat as "showroom" | "online",
          location: eventLocation,
          meetLink: calResult.meetLink,
          bookingId: booking.id,
          rescheduleToken,
          cancelToken,
        }),
      ),
    );

    return Response.json({
      success: true,
      booking: {
        id: booking.id,
        assignedAm: am.name,
        slotStart,
        slotEnd,
        meetLink: calResult.meetLink,
        location: eventLocation,
        status: "confirmed",
      },
    });
  }

  // --- Callback flow (site_visit or legacy intro_call) ---
  if (!preferredDate) {
    return Response.json({ error: "Missing preferred date" }, { status: 400 });
  }

  // Round-robin AM assignment
  const introCallCount = await countBookingsByType(env, "intro_call");
  const amIndex = introCallCount % AM_CONFIG.length;
  const assignedAm = AM_CONFIG[amIndex];

  const formatNote = meetingFormat ? `[${formatLabels[meetingFormat]}]` : "";
  const combinedNotes = [formatNote, notes].filter(Boolean).join("\n") || null;

  const booking = await insertBooking(env, {
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
    meeting_format: meetingFormat || null,
  });

  // HubSpot (callback flow)
  waitUntil(
    alertOnFailure(
      env,
      "HubSpot kennismaking-booked (callback flow)",
      setKennismakingBooked(env, partnerEmail, hubspotDealId, preferredDate),
    ),
  );

  // Wall-E OS milestone
  waitUntil(
    alertOnFailure(
      env,
      "Wall-E OS kennismaking_booked (callback flow)",
      postWalleosBooking(env, {
        event_id: `booking-kennismaking-${booking.id}`,
        event_type: "kennismaking_booked",
        partner_email: partnerEmail,
        hubspot_deal_id: hubspotDealId || undefined,
        session: {
          session_id: String(booking.id),
          start_at: `${preferredDate}T09:00:00Z`,
          host: assignedAm.name,
        },
      }),
    ),
  );

  // Google Sheet
  waitUntil(
    alertOnFailure(
      env,
      "Bookings sheet append (callback intro_call)",
      appendBookingRow(env, {
        type: "intro_call",
        partnerName,
        email: partnerEmail,
        phone: partnerPhone,
        company: companyName,
        date: preferredDate,
        am: assignedAm.name,
        status: "pending_am_confirmation",
        hubspotDealId: "",
      }).then((rowId) => {
        if (rowId) return updateBookingSheetRow(env, booking.id, rowId);
      }),
    ),
  );

  // Slack
  const formatLabel = meetingFormat ? formatLabels[meetingFormat] : "Intro call";
  waitUntil(
    alertOnFailure(
      env,
      "Slack intro-call notification (callback)",
      sendSlackNotification(
        env,
        formatIntroCallNotification({
          partnerName,
          companyName,
          amName: assignedAm.name,
          date: preferredDate,
          time: preferredTimeSlot || "n.t.b.",
          phone: partnerPhone,
          meetingFormat: formatLabel,
        }),
      ),
    ),
  );

  // Confirmation email for site visits
  if (meetingFormat === "site_visit" && location) {
    waitUntil(
      alertOnFailure(
        env,
        "Site visit confirmation email",
        sendSiteVisitConfirmation(env, {
          to: partnerEmail,
          partnerName,
          companyName,
          amName: assignedAm.name,
          location,
        }),
      ),
    );
  }

  return Response.json({
    success: true,
    booking: {
      id: booking.id,
      assignedAm: assignedAm.name,
      preferredDate,
      status: "pending_am_confirmation",
    },
  });
}

// ---------------------------------------------------------------------------
// First install
// ---------------------------------------------------------------------------

async function handleFirstInstallBooking(
  env: Env,
  body: Record<string, unknown>,
  waitUntil: (p: Promise<unknown>) => void,
) {
  const {
    partnerName,
    partnerEmail,
    partnerPhone,
    companyName,
    kvkNumber,
    installationAddress,
    preferredWeek,
    notes,
  } = body as {
    partnerName: string;
    partnerEmail: string;
    partnerPhone: string;
    companyName: string;
    kvkNumber?: string;
    installationAddress: string;
    preferredWeek: string;
    notes?: string;
  };

  if (
    !partnerName ||
    !partnerEmail ||
    !partnerPhone ||
    !companyName ||
    !installationAddress ||
    !preferredWeek
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const assignedAm = AM_CONFIG[0]; // Ralph

  const booking = await insertBooking(env, {
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
  });

  // Tentative week-long calendar hold on IC calendar
  waitUntil(
    alertOnFailure(
      env,
      "First install calendar hold",
      createFirstInstallHold(env, {
        companyName,
        partnerName,
        partnerEmail,
        partnerPhone,
        installationAddress,
        preferredWeek,
        amEmail: assignedAm.email,
        notes,
      }).then((calendarEventId) => {
        if (calendarEventId) return updateBookingCalendar(env, booking.id, calendarEventId);
      }),
    ),
  );

  // Google Sheet
  waitUntil(
    alertOnFailure(
      env,
      "Bookings sheet append (first_install)",
      appendBookingRow(env, {
        type: "first_install",
        partnerName,
        email: partnerEmail,
        phone: partnerPhone,
        company: companyName,
        date: preferredWeek,
        am: assignedAm.name,
        status: "pending_am_confirmation",
        hubspotDealId: "",
      }).then((rowId) => {
        if (rowId) return updateBookingSheetRow(env, booking.id, rowId);
      }),
    ),
  );

  // Slack
  waitUntil(
    alertOnFailure(
      env,
      "Slack first-install notification",
      sendSlackNotification(
        env,
        formatFirstInstallNotification({
          partnerName,
          companyName,
          address: installationAddress,
          preferredWeek,
        }),
      ),
    ),
  );

  // Confirmation email
  waitUntil(
    alertOnFailure(
      env,
      "First install confirmation email",
      sendFirstInstallConfirmation(env, {
        to: partnerEmail,
        partnerName,
        amName: assignedAm.name,
        address: installationAddress,
        preferredWeek,
      }),
    ),
  );

  // Wall-E OS milestone
  waitUntil(
    alertOnFailure(
      env,
      "Wall-E OS first_install_booked push",
      postWalleosBooking(env, {
        event_id: `booking-first-install-${booking.id}`,
        event_type: "first_install_booked",
        partner_email: partnerEmail,
        session: {
          session_id: String(booking.id),
          start_at: preferredWeek,
          host: assignedAm.name,
        },
      }),
    ),
  );

  return Response.json({
    success: true,
    booking: {
      id: booking.id,
      status: "pending_am_confirmation",
      assignedAm: assignedAm.name,
    },
  });
}
