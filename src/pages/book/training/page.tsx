/**
 * /book/training -- Training session selection + booking.
 */

import { useState, useEffect } from "react";

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  spotsRemaining: number;
}

interface BookingResult {
  id: string;
  sessionDate: string;
  sessionTime: string;
  location: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function getSearchParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) || "";
}

export function TrainingPage() {
  const prefill = {
    name: getSearchParam("name"),
    company: getSearchParam("company"),
    email: getSearchParam("email"),
    phone: getSearchParam("phone"),
    kvk: getSearchParam("kvk"),
  };

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Kon trainingen niet laden. Probeer het later opnieuw.");
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSession) return;

    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      type: "training",
      sessionId: selectedSession.id,
      partnerName: form.get("partnerName"),
      partnerEmail: form.get("partnerEmail"),
      partnerPhone: form.get("partnerPhone"),
      companyName: form.get("companyName"),
      kvkNumber: form.get("kvkNumber") || undefined,
      notes: form.get("notes") || undefined,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Boeking mislukt");
        setSubmitting(false);
        return;
      }

      setResult(json.booking);
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1A7A6B]/10 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#1A7A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#1A1A1A]">Boeking bevestigd!</h1>
        <div className="mt-6 bg-white rounded-xl border border-[#E8E4DD] p-5 text-left">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Datum</td>
                <td className="py-2 font-semibold">{result.sessionDate}</td>
              </tr>
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Tijd</td>
                <td className="py-2 font-semibold">{result.sessionTime}</td>
              </tr>
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Locatie</td>
                <td className="py-2 font-semibold">{result.location}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[#8A8580]">Je ontvangt een agenda-uitnodiging via e-mail. Tot dan!</p>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">Installatie Training</h1>
          <p className="mt-3 text-[#8A8580] max-w-lg leading-relaxed">
            Kies een trainingsdatum en vul je gegevens in om een plek te reserveren.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {loading ? (
          <div className="text-center py-16 text-[#8A8580]">Trainingen laden...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] p-10 text-center">
            <p className="text-[#8A8580]">
              Er zijn momenteel geen trainingen beschikbaar. Neem contact op met je account manager.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Kies een datum</h2>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  disabled={session.spotsRemaining <= 0}
                  className={`w-full text-left rounded-xl p-5 border-2 transition-all duration-200 ${
                    selectedSession?.id === session.id
                      ? "bg-white border-[#FF6933] shadow-sm"
                      : session.spotsRemaining <= 0
                        ? "bg-[#F7F5F0] border-[#E8E4DD] opacity-50 cursor-not-allowed"
                        : "bg-white border-[#E8E4DD] hover:border-[#FF6933]/40"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-[#1A1A1A]">{formatDate(session.date)}</div>
                      <div className="text-sm text-[#8A8580] mt-1">
                        {session.startTime} - {session.endTime} &middot; {session.location}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        session.spotsRemaining <= 0
                          ? "bg-red-50 text-red-600"
                          : session.spotsRemaining <= 2
                            ? "bg-[#FF6933]/10 text-[#FF6933]"
                            : "bg-[#1A7A6B]/10 text-[#1A7A6B]"
                      }`}
                    >
                      {session.spotsRemaining <= 0
                        ? "Vol"
                        : `${session.spotsRemaining} ${session.spotsRemaining === 1 ? "plek" : "plekken"} vrij`}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {selectedSession && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Je gegevens</h2>
                  <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField name="partnerName" label="Naam" required placeholder="Jan de Vries" defaultValue={prefill.name} />
                      <InputField name="companyName" label="Bedrijfsnaam" required placeholder="Installatiebedrijf BV" defaultValue={prefill.company} />
                      <InputField name="partnerEmail" label="E-mailadres" type="email" required placeholder="jan@bedrijf.nl" defaultValue={prefill.email} />
                      <InputField name="partnerPhone" label="Telefoonnummer" type="tel" required placeholder="06-12345678" defaultValue={prefill.phone} />
                      <InputField name="kvkNumber" label="KvK-nummer" placeholder="Optioneel" defaultValue={prefill.kvk} />
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">Opmerkingen</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        placeholder="Eventuele opmerkingen of vragen"
                        className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#FF6933] text-white font-semibold rounded-full px-8 py-3.5 text-base hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? "Bezig met boeken..." : "Training boeken"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InputField({
  name, label, type = "text", required, placeholder, defaultValue,
}: {
  name: string; label: string; type?: string; required?: boolean;
  placeholder?: string; defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">
        {label}{required && <span className="text-[#FF6933] ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
      />
    </div>
  );
}
