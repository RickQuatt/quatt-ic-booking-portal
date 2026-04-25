/**
 * /book/training -- Training session selection + booking.
 * Premium-utility design matching AM Toolkit.
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
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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
      const testFlag = getSearchParam("test") === "1" ? "?test=1" : "";
      const res = await fetch(`/api/bookings${testFlag}`, {
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
      <div className="bg-quatt-bg min-h-[calc(100vh-65px)]">
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-quatt-success-bg flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-quatt-success-text" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 text-[28px] font-semibold text-quatt-ink tracking-[-0.04em]">Boeking bevestigd</h1>
          <div className="mt-6 bg-white rounded-[14px] border border-quatt-border-light shadow-card p-5 text-left space-y-2">
            <DetailRow label="Datum" value={result.sessionDate} />
            <DetailRow label="Tijd" value={result.sessionTime} />
            <DetailRow label="Locatie" value={result.location} />
          </div>
          <p className="mt-5 text-[14px] text-quatt-text-secondary">Je ontvangt een agenda-uitnodiging via e-mail. Tot dan!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-quatt-bg min-h-[calc(100vh-65px)]">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-14">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
            Installatie Training
          </p>
          <h1 className="text-[32px] md:text-[40px] font-semibold text-quatt-ink leading-[1.1] tracking-[-0.04em]">
            Plan je Quatt training
          </h1>
          <p className="mt-3 text-[16px] text-quatt-text-secondary max-w-lg leading-relaxed">
            Kies een trainingsdatum en vul je gegevens in om een plek te reserveren.
          </p>
        </header>

        {loading ? (
          <div className="bg-white rounded-[14px] border border-quatt-border-light shadow-card p-8 text-center text-[14px] text-quatt-text-secondary">
            Trainingen laden...
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-quatt-border-light shadow-card p-8 text-center">
            <p className="text-[14px] text-quatt-text-secondary">
              Er zijn momenteel geen trainingen beschikbaar. Neem contact op met je account manager.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
                Kies een datum
              </h2>
              <div className="space-y-2.5">
                {sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id;
                  const isFull = session.spotsRemaining <= 0;
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      disabled={isFull}
                      className={`w-full text-left rounded-[14px] p-4 border transition-all duration-150 ${
                        isSelected
                          ? "bg-white border-quatt-orange shadow-card-hover ring-1 ring-quatt-orange/30"
                          : isFull
                            ? "bg-quatt-bg border-quatt-border-light opacity-60 cursor-not-allowed"
                            : "bg-white border-quatt-border-light shadow-card hover:shadow-card-hover"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div>
                          <div className="text-[15px] font-semibold text-quatt-ink tracking-[-0.01em]">
                            {formatDate(session.date)}
                          </div>
                          <div className="text-[13px] text-quatt-text-secondary mt-0.5">
                            {session.startTime} - {session.endTime} &middot; {session.location}
                          </div>
                        </div>
                        <SpotsBadge remaining={session.spotsRemaining} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedSession && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <section>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
                    Je gegevens
                  </h2>
                  <div className="bg-white rounded-[14px] border border-quatt-border-light shadow-card p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField name="partnerName" label="Naam" required placeholder="Jan de Vries" defaultValue={prefill.name} />
                      <InputField name="companyName" label="Bedrijfsnaam" required placeholder="Installatiebedrijf BV" defaultValue={prefill.company} />
                      <InputField name="partnerEmail" label="E-mailadres" type="email" required placeholder="jan@bedrijf.nl" defaultValue={prefill.email} />
                      <InputField name="partnerPhone" label="Telefoonnummer" type="tel" required placeholder="06-12345678" defaultValue={prefill.phone} />
                      <InputField name="kvkNumber" label="KvK-nummer" placeholder="Optioneel" defaultValue={prefill.kvk} />
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">
                        Opmerkingen
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        placeholder="Eventuele opmerkingen of vragen"
                        className="w-full rounded-[12px] bg-white px-3.5 py-2.5 text-[15px] text-quatt-ink border-[1.5px] border-quatt-border-mid focus:outline-none focus:border-quatt-orange focus:ring-2 focus:ring-quatt-orange/20 transition-colors duration-150 resize-none"
                      />
                    </div>
                  </div>
                </section>

                {error && (
                  <div className="bg-quatt-error-bg border border-quatt-error-border rounded-[12px] p-3.5 text-[13px] text-quatt-error-text">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-quatt-orange text-white font-semibold rounded-full px-6 py-3.5 text-[15px] hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-card"
                >
                  {submitting ? "Bezig met boeken..." : "Training boeken"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpotsBadge({ remaining }: { remaining: number }) {
  if (remaining <= 0) {
    return (
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-quatt-error-bg text-quatt-error-text border border-quatt-error-border">
        Vol
      </span>
    );
  }
  if (remaining <= 2) {
    return (
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-quatt-warning-bg text-quatt-warning-text border border-quatt-warning-border">
        {remaining} {remaining === 1 ? "plek" : "plekken"}
      </span>
    );
  }
  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-quatt-success-bg text-quatt-success-text">
      {remaining} plekken vrij
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-quatt-bg px-3 py-2">
      <span className="text-[12px] font-medium uppercase tracking-wider text-quatt-text-secondary">
        {label}
      </span>
      <span className="text-[14px] font-semibold text-quatt-ink text-right">{value}</span>
    </div>
  );
}

function InputField({
  name,
  label,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">
        {label}
        {required && <span className="text-quatt-orange ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-[12px] bg-white px-3.5 py-2.5 text-[15px] text-quatt-ink border-[1.5px] border-quatt-border-mid focus:outline-none focus:border-quatt-orange focus:ring-2 focus:ring-quatt-orange/20 transition-colors duration-150"
      />
    </div>
  );
}
