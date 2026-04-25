/**
 * /book/kennismaking -- Main booking flow for intro calls.
 * Meeting format selection (showroom/online/site visit), date/time picker, contact form.
 */

import { useState, useCallback } from "react";

type MeetingFormat = "showroom" | "online" | "site_visit";

interface Slot {
  start: string;
  end: string;
  amEmail: string;
  amName: string;
}

interface BookingResult {
  id: string;
  assignedAm: string;
  slotStart?: string;
  slotEnd?: string;
  meetLink?: string | null;
  location?: string | null;
  preferredDate?: string;
  status: string;
}

const AM_CONFIG = [
  { email: "ralph@quatt.io", name: "Ralph Peper", role: "Installatiepartnermanager" },
  { email: "mitchell.k@quatt.io", name: "Mitchell van Kleef", role: "Installatiepartnermanager" },
];

const MEETING_OPTIONS: { id: MeetingFormat; title: string; description: string; accentColor: string }[] = [
  {
    id: "showroom",
    title: "Kom langs in de showroom",
    description: "Bezoek ons kantoor in Amsterdam en bekijk de Quatt producten in het echt. Gesprek met Ralph.",
    accentColor: "#1A7A6B",
  },
  {
    id: "online",
    title: "Plan een online gesprek",
    description: "Videogesprek via Google Meet. Duurt ongeveer 30 minuten.",
    accentColor: "#FF6933",
  },
  {
    id: "site_visit",
    title: "Wij komen bij jou langs",
    description: "Onze accountmanager bezoekt je op locatie. Laat je adres achter, wij nemen contact op.",
    accentColor: "#97B9BF",
  },
];

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

function getSearchParam(name: string): string {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

export function KennismakingPage() {
  const prefill = {
    name: getSearchParam("name"),
    company: getSearchParam("company"),
    email: getSearchParam("email"),
    phone: getSearchParam("phone"),
    dealId: getSearchParam("dealId"),
  };

  const [selectedFormat, setSelectedFormat] = useState<MeetingFormat | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsSlotPicker = selectedFormat === "showroom" || selectedFormat === "online";

  const fetchSlots = useCallback(async (date: string, format: MeetingFormat) => {
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const res = await fetch(`/api/slots?date=${date}&format=${format}`);
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
  }, []);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value;
    setSelectedDate(date);
    if (date && selectedFormat && needsSlotPicker) {
      fetchSlots(date, selectedFormat);
    }
  }

  function handleFormatSelect(format: MeetingFormat) {
    setSelectedFormat(format);
    setSelectedSlot(null);
    setSlots([]);
    setSlotsError(null);
    setSelectedDate("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const baseData = {
      type: "intro_call",
      meetingFormat: selectedFormat,
      partnerName: form.get("partnerName"),
      partnerEmail: form.get("partnerEmail"),
      partnerPhone: form.get("partnerPhone"),
      companyName: form.get("companyName"),
      notes: form.get("notes") || undefined,
      hubspotDealId: prefill.dealId || undefined,
    };

    let data: Record<string, unknown>;

    if (needsSlotPicker && selectedSlot) {
      data = {
        ...baseData,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end,
        amEmail: selectedSlot.amEmail,
      };
      if (selectedFormat === "showroom") {
        data.location = "Kon. Wilhelminaplein 29, 1062HJ Amsterdam";
      }
    } else {
      data = {
        ...baseData,
        preferredDate: form.get("preferredDate"),
        preferredTimeSlot: form.get("preferredTimeSlot"),
        location: form.get("location") || undefined,
      };
    }

    try {
      // Forward ?test=1 from page URL to API to short-circuit side effects during QA.
      const testFlag = getSearchParam("test") === "1" ? "?test=1" : "";
      const res = await fetch(`/api/bookings${testFlag}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Aanvraag mislukt");
        if (res.status === 409 && selectedDate && selectedFormat) {
          fetchSlots(selectedDate, selectedFormat);
        }
        setSubmitting(false);
        return;
      }

      setResult({ ...json.booking, meetingFormat: selectedFormat });
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Confirmation view ---
  if (result) {
    const isConfirmed = result.status === "confirmed";
    return (
      <div className="bg-quatt-bg min-h-[calc(100vh-65px)]">
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-quatt-success-bg flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-quatt-success-text" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-6 text-[28px] font-semibold text-quatt-ink tracking-[-0.04em]">
            {isConfirmed ? "Je afspraak is bevestigd" : "Terugbelverzoek ontvangen"}
          </h1>
          <div className="mt-6 bg-white rounded-[14px] border border-quatt-border-light shadow-card p-5 text-left space-y-2">
            {isConfirmed && result.slotStart && (
              <>
                <DetailRow label="Datum" value={formatDateNL(result.slotStart.split("T")[0])} />
                <DetailRow label="Tijd" value={`${formatTime(result.slotStart)} - ${formatTime(result.slotEnd!)}`} />
              </>
            )}
            <DetailRow label="Account manager" value={result.assignedAm} />
            {result.location && <DetailRow label="Locatie" value={result.location} />}
            {result.meetLink && (
              <DetailRow
                label="Google Meet"
                value={
                  <a href={result.meetLink} className="text-quatt-orange hover:underline">
                    {result.meetLink}
                  </a>
                }
              />
            )}
          </div>
          <p className="mt-5 text-[14px] text-quatt-text-secondary">
            {isConfirmed
              ? "Je ontvangt een agenda-uitnodiging per e-mail."
              : "Je account manager neemt binnen 1 werkdag contact met je op."}
          </p>
        </div>
      </div>
    );
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="bg-quatt-bg min-h-[calc(100vh-65px)]">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-14">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
            Kennismakingsgesprek
          </p>
          <h1 className="text-[32px] md:text-[40px] font-semibold text-quatt-ink leading-[1.1] tracking-[-0.04em]">
            Plan een kennismakingsgesprek
          </h1>
          <p className="mt-3 text-[16px] text-quatt-text-secondary max-w-lg leading-relaxed">
            Kies hoe je kennis wilt maken met Quatt. We plannen het gesprek op een moment dat jou uitkomt.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Meeting format */}
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
              Hoe wil je kennismaken?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MEETING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleFormatSelect(option.id)}
                  className={`text-left p-5 rounded-[14px] border transition-all duration-150 ${
                    selectedFormat === option.id
                      ? "border-quatt-orange bg-white shadow-card-hover ring-1 ring-quatt-orange/30"
                      : "border-quatt-border-light bg-white shadow-card hover:shadow-card-hover"
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${option.accentColor}20`, color: option.accentColor }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      {option.id === "showroom" && (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      )}
                      {option.id === "online" && (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                      {option.id === "site_visit" && (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </>
                      )}
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-semibold text-quatt-ink tracking-[-0.01em]">{option.title}</h3>
                  <p className="mt-1 text-[13px] text-quatt-text-secondary leading-relaxed">{option.description}</p>
                  {selectedFormat === option.id && (
                    <div className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-quatt-orange">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      Geselecteerd
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {selectedFormat && (
            <>
              {/* AM info */}
              {selectedFormat === "showroom" && (
                <AmInfoCard
                  avatars={[{ initials: "RP", color: "#1A7A6B" }]}
                  title={`Je gesprek is met ${AM_CONFIG[0].name}`}
                  subtitle={AM_CONFIG[0].role}
                />
              )}
              {selectedFormat === "online" && (
                <AmInfoCard
                  avatars={AM_CONFIG.map((am) => ({
                    initials: am.name.split(" ").map((n) => n[0]).join(""),
                    color: "#FF6933",
                  }))}
                  title={`Je spreekt met ${AM_CONFIG.map((a) => a.name.split(" ")[0]).join(" of ")}`}
                  subtitle="Beschikbaarheid hangt af van de gekozen datum"
                />
              )}
              {selectedFormat === "site_visit" && (
                <AmInfoCard
                  avatars={AM_CONFIG.map((am) => ({
                    initials: am.name.split(" ").map((n) => n[0]).join(""),
                    color: "#97B9BF",
                  }))}
                  title="Een van onze account managers neemt contact met je op"
                  subtitle="We plannen samen een geschikt moment in"
                />
              )}

              {/* Step 2: Contact details */}
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
                  </div>
                </div>
              </section>

              {/* Step 3: Slot picker (showroom / online) */}
              {needsSlotPicker && (
                <section>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
                    Kies een datum en tijd
                  </h2>

                  {selectedFormat === "showroom" && (
                    <div className="bg-white rounded-[14px] border border-quatt-border-light shadow-card p-4 mb-3">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-quatt-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-[14px] font-semibold text-quatt-ink">Quatt B.V.</p>
                          <p className="text-[14px] text-quatt-text-secondary">Kon. Wilhelminaplein 29, 1062HJ Amsterdam</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-[14px] border border-quatt-border-light shadow-card p-5 space-y-5">
                    <div>
                      <label htmlFor="_slotDate" className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">
                        Datum<span className="text-quatt-orange ml-0.5">*</span>
                      </label>
                      <input
                        id="_slotDate"
                        type="date"
                        required
                        min={minDateStr}
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="w-full sm:w-72 rounded-[12px] bg-white px-3.5 py-2.5 text-[15px] text-quatt-ink border-[1.5px] border-quatt-border-mid focus:outline-none focus:border-quatt-orange focus:ring-2 focus:ring-quatt-orange/20 transition-colors duration-150"
                      />
                      {selectedDate && (
                        <p className="mt-2 text-[13px] text-quatt-text-secondary">{formatDateNL(selectedDate)}</p>
                      )}
                    </div>

                    {slotsLoading && (
                      <div className="flex items-center gap-2 text-quatt-text-secondary text-[13px]">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Beschikbaarheid ophalen...
                      </div>
                    )}

                    {slotsError && <p className="text-quatt-text-secondary text-[13px]">{slotsError}</p>}

                    {slots.length > 0 && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">Beschikbare tijden</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-all duration-150 ${
                                selectedSlot?.start === slot.start
                                  ? "bg-quatt-orange text-white shadow-sm"
                                  : "bg-white border-[1.5px] border-quatt-border-mid text-quatt-ink hover:border-quatt-orange"
                              }`}
                            >
                              {formatTime(slot.start)}
                            </button>
                          ))}
                        </div>
                        {selectedSlot && (
                          <div className="mt-4 flex items-center gap-2 text-[13px] text-quatt-green font-medium">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                            {formatDateNL(selectedDate)}, {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)} met {selectedSlot.amName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Step 3 alt: Callback flow (site_visit) */}
              {selectedFormat === "site_visit" && (
                <section>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
                    Waar en wanneer?
                  </h2>
                  <div className="bg-white rounded-[14px] border border-quatt-border-light shadow-card p-5 space-y-4">
                    <InputField name="location" label="Adres (bezoeklocatie)" required placeholder="Straatnaam 1, 1234AB Plaatsnaam" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField name="preferredDate" label="Voorkeursweek" type="date" required min={minDateStr} />
                      <div>
                        <label htmlFor="preferredTimeSlot" className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">
                          Voorkeurstijd<span className="text-quatt-orange ml-0.5">*</span>
                        </label>
                        <select
                          id="preferredTimeSlot"
                          name="preferredTimeSlot"
                          required
                          className="w-full rounded-[12px] bg-white px-3.5 py-2.5 text-[15px] text-quatt-ink border-[1.5px] border-quatt-border-mid focus:outline-none focus:border-quatt-orange focus:ring-2 focus:ring-quatt-orange/20 transition-colors duration-150"
                        >
                          <option value="">Kies een moment</option>
                          <option value="morning">Ochtend (9:00 - 12:00)</option>
                          <option value="afternoon">Middag (13:00 - 17:00)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Notes */}
              <section>
                <div className="bg-white rounded-[14px] border border-quatt-border-light shadow-card p-5">
                  <label htmlFor="notes" className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">Opmerkingen</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Waar wil je het over hebben? Heb je al ervaring met warmtepompen?"
                    className="w-full rounded-[12px] bg-white px-3.5 py-2.5 text-[15px] text-quatt-ink border-[1.5px] border-quatt-border-mid focus:outline-none focus:border-quatt-orange focus:ring-2 focus:ring-quatt-orange/20 transition-colors duration-150 resize-none"
                  />
                </div>
              </section>

              {error && (
                <div className="bg-quatt-error-bg border border-quatt-error-border rounded-[12px] p-3.5 text-[13px] text-quatt-error-text">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (needsSlotPicker && !selectedSlot)}
                className="w-full bg-quatt-orange text-white font-semibold rounded-full px-6 py-3.5 text-[15px] hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-card"
              >
                {submitting
                  ? "Bezig met versturen..."
                  : needsSlotPicker
                    ? "Afspraak bevestigen"
                    : "Bezoekverzoek versturen"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// --- Helper components ---

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

function AmInfoCard({
  avatars,
  title,
  subtitle,
}: {
  avatars: { initials: string; color: string }[];
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-[14px] border border-quatt-border-light shadow-card">
      <div className="flex -space-x-2">
        {avatars.map((av, i) => (
          <div
            key={i}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[12px] border-2 border-white"
            style={{ backgroundColor: av.color }}
          >
            {av.initials}
          </div>
        ))}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-quatt-ink">{title}</p>
        <p className="text-[13px] text-quatt-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

// --- Reusable input component ---

function InputField({
  name, label, type = "text", required, placeholder, defaultValue, min,
}: {
  name: string; label: string; type?: string; required?: boolean;
  placeholder?: string; defaultValue?: string; min?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-2">
        {label}{required && <span className="text-quatt-orange ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        className="w-full rounded-[12px] bg-white px-3.5 py-2.5 text-[15px] text-quatt-ink border-[1.5px] border-quatt-border-mid focus:outline-none focus:border-quatt-orange focus:ring-2 focus:ring-quatt-orange/20 transition-colors duration-150"
      />
    </div>
  );
}
