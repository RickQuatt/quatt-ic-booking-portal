/**
 * /book/kennismaking/reschedule -- Reschedule flow (HMAC token in URL).
 */

import { useState, useCallback, useEffect } from "react";

interface Slot {
  start: string;
  end: string;
  amEmail: string;
  amName: string;
}

interface BookingInfo {
  id: string;
  partnerName: string;
  companyName: string;
  preferredDate: string | null;
  preferredTimeSlot: string | null;
  assignedAm: string | null;
  calendarEventId: string | null;
  status: string;
  notes: string | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
  });
}

function formatDateNL(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam",
  });
}

function getSearchParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export function ReschedulePage() {
  const bookingId = getSearchParam("id");
  const token = getSearchParam("token");
  const email = getSearchParam("email");

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    date: string; startTime: string; endTime: string;
    meetLink?: string | null; location?: string | null;
  } | null>(null);

  const meetingFormat = booking?.notes?.includes("[Online videogesprek") ? "online" : "showroom";

  useEffect(() => {
    if (!bookingId || !token || !email) {
      setPageError("Ongeldige link. Controleer de link in je e-mail.");
      setPageLoading(false);
      return;
    }

    fetch(`/api/bookings/${bookingId}?token=${token}&email=${encodeURIComponent(email)}&action=reschedule`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Kon boeking niet laden");
        }
        return res.json();
      })
      .then((data) => {
        if (!data.calendarEventId) {
          setPageError("Dit type boeking kan niet online worden verplaatst. Bel ons op 020 808 2116.");
          return;
        }
        if (data.status !== "confirmed") {
          setPageError("Deze boeking kan niet meer worden verplaatst.");
          return;
        }
        setBooking(data);
      })
      .catch((e) => setPageError(e.message))
      .finally(() => setPageLoading(false));
  }, [bookingId, token, email]);

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const res = await fetch(`/api/slots?date=${date}&format=${meetingFormat}`);
      const json = await res.json();

      if (!res.ok) {
        setSlotsError(json.error || "Kon beschikbaarheid niet ophalen");
        return;
      }

      if (json.slots.length === 0) {
        setSlotsError("Geen beschikbare tijdsloten op deze dag. Probeer een andere datum.");
      } else {
        setSlots(json.slots);
      }
    } catch {
      setSlotsError("Er ging iets mis bij het ophalen van de beschikbaarheid.");
    } finally {
      setSlotsLoading(false);
    }
  }, [meetingFormat]);

  async function handleSubmit() {
    if (!bookingId || !token || !email || !selectedSlot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, email,
          newSlotStart: selectedSlot.start,
          newSlotEnd: selectedSlot.end,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Verplaatsen mislukt");
        if (res.status === 409 && selectedDate) fetchSlots(selectedDate);
        return;
      }

      setSuccess({
        date: json.booking.date,
        startTime: json.booking.startTime,
        endTime: json.booking.endTime,
        meetLink: json.booking.meetLink,
        location: json.booking.location,
      });
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#FF6933] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-lg mx-auto text-center bg-white rounded-xl border border-[#E8E4DD] p-8">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">Kan niet verplaatsen</h2>
          <p className="text-[#8A8580]">{pageError}</p>
          <p className="mt-4 text-sm text-[#8A8580]">
            Bel ons op <a href="tel:+31208082116" className="text-[#FF6933] hover:underline">020 808 2116</a> voor hulp.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1A7A6B]/10 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#1A7A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#1A1A1A]">Je afspraak is verplaatst!</h1>
        <div className="mt-6 bg-white rounded-xl border border-[#E8E4DD] p-5 text-left">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Nieuwe datum</td>
                <td className="py-2 font-semibold">{formatDateNL(success.date)}</td>
              </tr>
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Tijd</td>
                <td className="py-2 font-semibold">{formatTime(success.startTime)} - {formatTime(success.endTime)}</td>
              </tr>
              {success.location && (
                <tr>
                  <td className="py-2 text-[#8A8580] pr-4">Locatie</td>
                  <td className="py-2 font-semibold">{success.location}</td>
                </tr>
              )}
              {success.meetLink && (
                <tr>
                  <td className="py-2 text-[#8A8580] pr-4">Google Meet</td>
                  <td className="py-2 font-semibold">
                    <a href={success.meetLink} className="text-[#FF6933] hover:underline">{success.meetLink}</a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[#8A8580]">Je ontvangt een nieuwe bevestiging en agenda-uitnodiging per e-mail.</p>
      </div>
    );
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div>
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">Afspraak verplaatsen</h1>
          <p className="mt-3 text-[#8A8580] max-w-lg leading-relaxed">Kies een nieuw moment voor je kennismakingsgesprek.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {booking && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Huidige afspraak</h2>
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
              <table className="w-full text-sm">
                <tbody>
                  {booking.preferredDate && (
                    <tr>
                      <td className="py-2 text-[#8A8580] pr-4">Datum</td>
                      <td className="py-2 font-semibold">{formatDateNL(booking.preferredDate)}</td>
                    </tr>
                  )}
                  {booking.preferredTimeSlot && (
                    <tr>
                      <td className="py-2 text-[#8A8580] pr-4">Tijd</td>
                      <td className="py-2 font-semibold">{booking.preferredTimeSlot}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 text-[#8A8580] pr-4">Type</td>
                    <td className="py-2 font-semibold">{meetingFormat === "online" ? "Online (Google Meet)" : "Showroom bezoek"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Kies een nieuw moment</h2>
          <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 space-y-6">
            <div>
              <label htmlFor="_slotDate" className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">
                Datum<span className="text-[#FF6933] ml-0.5">*</span>
              </label>
              <input
                id="_slotDate"
                type="date"
                required
                min={minDateStr}
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); if (e.target.value) fetchSlots(e.target.value); }}
                className="w-full sm:w-72 rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
              />
              {selectedDate && <p className="mt-2 text-sm text-[#8A8580]">{formatDateNL(selectedDate)}</p>}
            </div>

            {slotsLoading && (
              <div className="flex items-center gap-2 text-[#8A8580] text-sm">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Beschikbaarheid ophalen...
              </div>
            )}

            {slotsError && <p className="text-[#8A8580] text-sm">{slotsError}</p>}

            {slots.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A]/60 mb-3">Beschikbare tijden</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedSlot?.start === slot.start
                          ? "bg-[#FF6933] text-white shadow-sm"
                          : "bg-[#F7F5F0] border-2 border-[#E8E4DD] text-[#1A1A1A] hover:border-[#FF6933]"
                      }`}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
                {selectedSlot && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-[#1A7A6B] font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {formatDateNL(selectedDate)}, {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)} met {selectedSlot.amName}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-4">
          <a
            href="/book/kennismaking"
            className="inline-flex items-center justify-center font-semibold text-base bg-transparent text-[#1A1A1A] border-2 border-[#E8E4DD] rounded-full px-8 py-3.5 hover:border-[#1A1A1A] transition-all duration-200"
          >
            Terug
          </a>
          <button
            disabled={submitting || !selectedSlot}
            onClick={handleSubmit}
            className="bg-[#FF6933] text-white font-semibold rounded-full px-8 py-3.5 text-base hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {submitting ? "Bezig met verplaatsen..." : "Afspraak verplaatsen"}
          </button>
        </div>
      </div>
    </div>
  );
}
