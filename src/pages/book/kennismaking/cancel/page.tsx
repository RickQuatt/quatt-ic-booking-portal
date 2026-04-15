/**
 * /book/kennismaking/cancel -- Cancel flow (HMAC token in URL).
 */

import { useState, useEffect } from "react";

interface BookingInfo {
  id: string;
  partnerName: string;
  companyName: string;
  preferredDate: string | null;
  preferredTimeSlot: string | null;
  assignedAm: string | null;
  status: string;
}

function getSearchParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export function CancelPage() {
  const bookingId = getSearchParam("id");
  const token = getSearchParam("token");
  const email = getSearchParam("email");

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId || !token || !email) {
      setError("Ongeldige link. Controleer de link in je e-mail.");
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/${bookingId}?token=${token}&email=${encodeURIComponent(email)}&action=cancel`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Kon boeking niet laden");
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === "cancelled") {
          setCancelled(true);
        }
        setBooking(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookingId, token, email]);

  async function handleCancel() {
    if (!bookingId || !token || !email) return;
    setCancelling(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Annuleren mislukt");
      }

      setCancelled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er is iets misgegaan");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#FF6933] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-lg mx-auto text-center bg-white rounded-xl border border-[#E8E4DD] p-8">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl font-bold text-[#1A1A1A]">Afspraak geannuleerd</h2>
          <p className="mt-3 text-[#8A8580]">
            Je kennismakingsgesprek is geannuleerd. Je ontvangt een bevestiging per e-mail.
          </p>
          <p className="mt-4 text-sm text-[#8A8580]">
            Wil je toch een afspraak inplannen? Ga naar{" "}
            <a href="/book/kennismaking" className="text-[#FF6933] hover:underline">ons boekingsportaal</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Afspraak annuleren</h1>
      <p className="text-[#8A8580] mb-8">
        Weet je zeker dat je je kennismakingsgesprek wilt annuleren?
      </p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {booking && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 mb-8">
          <table className="w-full text-sm">
            <tbody>
              {booking.preferredDate && (
                <tr>
                  <td className="py-2 text-[#8A8580] pr-4">Datum</td>
                  <td className="py-2 font-semibold">
                    {new Date(booking.preferredDate + "T00:00:00").toLocaleDateString("nl-NL", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam",
                    })}
                  </td>
                </tr>
              )}
              {booking.preferredTimeSlot && (
                <tr>
                  <td className="py-2 text-[#8A8580] pr-4">Tijd</td>
                  <td className="py-2 font-semibold">{booking.preferredTimeSlot}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Bedrijf</td>
                <td className="py-2 font-semibold">{booking.companyName}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-4">
        <a
          href="/book/kennismaking"
          className="inline-flex items-center justify-center font-semibold text-base bg-transparent text-[#1A1A1A] border-2 border-[#E8E4DD] rounded-full px-8 py-3.5 hover:border-[#1A1A1A] transition-all duration-200"
        >
          Terug
        </a>
        <button
          disabled={cancelling}
          onClick={handleCancel}
          className="bg-red-500 text-white font-semibold rounded-full px-8 py-3.5 text-base hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {cancelling ? "Bezig..." : "Ja, annuleer mijn afspraak"}
        </button>
      </div>
    </div>
  );
}
