/**
 * /book/install -- First installation scheduling.
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
      const res = await fetch("/api/bookings", {
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
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#97B9BF]/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#97B9BF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#1A1A1A]">Aanvraag ontvangen!</h1>
        <div className="mt-6 bg-white rounded-xl border border-[#E8E4DD] p-5 text-left">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Account manager</td>
                <td className="py-2 font-semibold">{result.assignedAm}</td>
              </tr>
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Status</td>
                <td className="py-2 font-semibold">Wacht op bevestiging</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[#8A8580]">
          Je account manager neemt contact op om een exacte datum en tijd af te spreken. Je ontvangt een bevestiging zodra de afspraak is ingepland.
        </p>
      </div>
    );
  }

  const weekOptions = getNextWeeks(8);

  return (
    <div>
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">Eerste Installatie</h1>
          <p className="mt-3 text-[#8A8580] max-w-lg leading-relaxed">
            Vraag begeleiding aan bij je eerste Quatt installatie. Een account manager komt ter plaatse om je te ondersteunen.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10">
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
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Installatie details</h2>
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 space-y-4">
              <InputField name="installationAddress" label="Installatieadres" required placeholder="Straat 123, 1234 AB Amsterdam" />
              <div>
                <label htmlFor="preferredWeek" className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">
                  Gewenste week<span className="text-[#FF6933] ml-0.5">*</span>
                </label>
                <select
                  id="preferredWeek"
                  name="preferredWeek"
                  required
                  className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
                >
                  <option value="">Kies een week</option>
                  {weekOptions.map((week) => (
                    <option key={week.value} value={week.value}>{week.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">Opmerkingen</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Type warmtepomp, bijzonderheden over de locatie, etc."
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
            {submitting ? "Bezig met versturen..." : "Eerste installatie aanvragen"}
          </button>
        </form>
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
