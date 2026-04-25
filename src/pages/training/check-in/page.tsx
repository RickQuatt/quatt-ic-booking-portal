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
        setError("Te veel verzoeken. Wacht even en probeer het opnieuw.");
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
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1A7A6B]/10 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-[#1A7A6B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-[#131A20]">
          Je bent ingecheckt
        </h1>
        <p className="mt-3 text-[#4D4D4A] leading-relaxed">
          Bedankt. Veel plezier bij de training.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10 md:py-14">
      <div className="rounded-2xl bg-[#E8EEEE] p-6 md:p-8 mb-8">
        <div className="w-11 h-11 rounded-xl bg-white/60 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-[#131A20]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.04em] text-[#131A20]">
          Training check-in
        </h1>
        <p className="mt-2 text-[15px] text-[#4D4D4A] leading-relaxed">
          Vul je gegevens in om je aanwezigheid te registreren.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#E8E4DD] p-6 md:p-8 space-y-5"
      >
        <Field
          id="email"
          name="email"
          label="E-mailadres"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="je@bedrijf.nl"
        />
        <Field
          id="name"
          name="name"
          label="Naam"
          type="text"
          required
          autoComplete="name"
          placeholder="Voor- en achternaam"
        />
        <Field
          id="company"
          name="company"
          label="Bedrijf"
          type="text"
          required
          autoComplete="organization"
          placeholder="Naam van je bedrijf"
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#FF6933] text-white font-semibold rounded-full px-8 py-3.5 text-base hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {submitting ? "Bezig..." : "Inchecken"}
        </button>
      </form>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type,
  required,
  placeholder,
  autoComplete,
  inputMode,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "email" | "text" | "tel" | "numeric";
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2"
      >
        {label}
        {required && <span className="text-[#FF6933] ml-0.5">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#131A20] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
      />
    </div>
  );
}
