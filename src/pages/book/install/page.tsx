/**
 * /book/install -- First installation scheduling.
 * Premium-utility design matching AM Toolkit.
 */

import { useState } from "react";

interface BookingResult {
  id: string;
  status: string;
  assignedAm: string;
}

function getSearchParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function getNextWeeks(count: number): { value: string; label: string }[] {
  const weeks: { value: string; label: string }[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + ((8 - startDate.getDay()) % 7 || 7));

  for (let i = 0; i < count; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const weekNum = getWeekNumber(weekStart);
    const value = `${weekStart.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    const label = `Week ${weekNum} (${weekStart.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })})`;
    weeks.push({ value, label });
  }
  return weeks;
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function InstallPage() {
  const prefill = {
    name: getSearchParam("name"),
    company: getSearchParam("company"),
    email: getSearchParam("email"),
    phone: getSearchParam("phone"),
    kvk: getSearchParam("kvk"),
  };

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      type: "first_install",
      partnerName: form.get("partnerName"),
      partnerEmail: form.get("partnerEmail"),
      partnerPhone: form.get("partnerPhone"),
      companyName: form.get("companyName"),
      kvkNumber: form.get("kvkNumber") || undefined,
      installationAddress: form.get("installationAddress"),
      preferredWeek: form.get("preferredWeek"),
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
        setError(json.error || "Aanvraag mislukt");
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
          <h1 className="mt-6 text-[28px] font-semibold text-quatt-ink tracking-[-0.04em]">Aanvraag ontvangen</h1>
          <div className="mt-6 bg-white rounded-[14px] border border-quatt-border-light shadow-card p-5 text-left space-y-2">
            <DetailRow label="Account manager" value={result.assignedAm} />
            <DetailRow label="Status" value="Wacht op bevestiging" />
          </div>
          <p className="mt-5 text-[14px] text-quatt-text-secondary">
            Je account manager neemt contact op om een exacte datum en tijd af te spreken. Je ontvangt een bevestiging zodra de afspraak is ingepland.
          </p>
        </div>
      </div>
    );
  }

  const weekOptions = getNextWeeks(8);

  return (
    <div className="bg-quatt-bg min-h-[calc(100vh-65px)]">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-14">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
            Eerste installatie
          </p>
          <h1 className="text-[32px] md:text-[40px] font-semibold text-quatt-ink leading-[1.1] tracking-[-0.04em]">
            Plan je eerste Quatt installatie
          </h1>
          <p className="mt-3 text-[16px] text-quatt-text-secondary max-w-lg leading-relaxed">
            Vraag begeleiding aan bij je eerste Quatt installatie. Een account manager komt ter plaatse om je te ondersteunen.
          </p>
        </header>

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
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
              Installatie details
            </h2>
            <div className="bg-white rounded-[14px] border border-quatt-border-light shadow-card p-5 space-y-4">
              <InputField name="installationAddress" label="Installatieadres" required placeholder="Straat 123, 1234 AB Amsterdam" />
              <div>
                <label htmlFor="preferredWeek" className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">
                  Gewenste week<span className="text-quatt-orange ml-0.5">*</span>
                </label>
                <select
                  id="preferredWeek"
                  name="preferredWeek"
                  required
                  className="w-full rounded-[12px] bg-white px-3.5 py-2.5 text-[15px] text-quatt-ink border-[1.5px] border-quatt-border-mid focus:outline-none focus:border-quatt-orange focus:ring-2 focus:ring-quatt-orange/20 transition-colors duration-150"
                >
                  <option value="">Kies een week</option>
                  {weekOptions.map((week) => (
                    <option key={week.value} value={week.value}>{week.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">
                  Opmerkingen
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Type warmtepomp, bijzonderheden over de locatie, etc."
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
            {submitting ? "Bezig met versturen..." : "Eerste installatie aanvragen"}
          </button>
        </form>
      </div>
    </div>
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
