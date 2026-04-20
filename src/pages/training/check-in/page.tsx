/**
 * /training/check-in
 *
 * Public check-in page. Partner scans the QR on the trainer's slide and lands
 * here. Submits email + name + company. On success, attendance is recorded
 * and the post-training email sequence unlocks in Partner Progression.
 *
 * Always shows a friendly success screen -- the endpoint is silent on miss
 * so we don't leak whether an email exists in our database.
 */

import { useState } from "react";

export function TrainingCheckInPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") || "").trim(),
      name: String(form.get("name") || "").trim(),
      company: String(form.get("company") || "").trim(),
    };

    if (!payload.email || !payload.name || !payload.company) {
      setError("Vul alle velden in.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/training/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setError(
          "Te veel verzoeken. Wacht even en probeer het opnieuw.",
        );
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "Er ging iets mis. Probeer het opnieuw.");
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white border border-[#E8E4DD] rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#DCEFE4] flex items-center justify-center mx-auto mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0D7A4C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-2">
            Je bent ingecheckt
          </h1>
          <p className="text-[#4A4641]">
            Bedankt. Veel plezier bij de training.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-2">
          Training check-in
        </h1>
        <p className="text-[#4A4641]">
          Vul hieronder je gegevens in om je aanwezigheid te registreren.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E8E4DD] rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-[#1A1A1A] mb-1"
          >
            E-mailadres
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className="w-full px-4 py-3 border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7A4C] focus:border-transparent"
            placeholder="je@bedrijf.nl"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-[#1A1A1A] mb-1"
          >
            Naam
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full px-4 py-3 border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7A4C] focus:border-transparent"
            placeholder="Voor- en achternaam"
          />
        </div>

        <div>
          <label
            htmlFor="company"
            className="block text-sm font-semibold text-[#1A1A1A] mb-1"
          >
            Bedrijf
          </label>
          <input
            id="company"
            name="company"
            type="text"
            required
            autoComplete="organization"
            className="w-full px-4 py-3 border border-[#E8E4DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7A4C] focus:border-transparent"
            placeholder="Naam van je bedrijf"
          />
        </div>

        {error && (
          <div className="text-sm text-[#B3261E] bg-[#FCEFEE] border border-[#F5C2C0] rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#0D7A4C] hover:bg-[#0A6340] disabled:bg-[#8A8580] text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {submitting ? "Bezig..." : "Inchecken"}
        </button>
      </form>
    </div>
  );
}
