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
      const res = await fetch("/api/bookings", {
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
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1A7A6B]/10 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#1A7A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#1A1A1A]">
          {isConfirmed ? "Je afspraak is bevestigd!" : "Terugbelverzoek ontvangen!"}
        </h1>
        <div className="mt-6 bg-white rounded-xl border border-[#E8E4DD] p-5 text-left">
          <table className="w-full text-sm">
            <tbody>
              {isConfirmed && result.slotStart && (
                <>
                  <tr>
                    <td className="py-2 text-[#8A8580] pr-4">Datum</td>
                    <td className="py-2 font-semibold">{formatDateNL(result.slotStart.split("T")[0])}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#8A8580] pr-4">Tijd</td>
                    <td className="py-2 font-semibold">{formatTime(result.slotStart)} - {formatTime(result.slotEnd!)}</td>
                  </tr>
                </>
              )}
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Account manager</td>
                <td className="py-2 font-semibold">{result.assignedAm}</td>
              </tr>
              {result.location && (
                <tr>
                  <td className="py-2 text-[#8A8580] pr-4">Locatie</td>
                  <td className="py-2 font-semibold">{result.location}</td>
                </tr>
              )}
              {result.meetLink && (
                <tr>
                  <td className="py-2 text-[#8A8580] pr-4">Google Meet</td>
                  <td className="py-2 font-semibold">
                    <a href={result.meetLink} className="text-[#FF6933] hover:underline">{result.meetLink}</a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[#8A8580]">
          {isConfirmed
            ? "Je ontvangt een agenda-uitnodiging per e-mail."
            : "Je account manager neemt binnen 1 werkdag contact met je op."}
        </p>
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
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Plan een kennismakingsgesprek
          </h1>
          <p className="mt-3 text-[#8A8580] max-w-lg leading-relaxed">
            Kies hoe je kennis wilt maken met Quatt. We plannen het gesprek op een moment dat jou uitkomt.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Meeting format */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Hoe wil je kennismaken?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MEETING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleFormatSelect(option.id)}
                  className={`text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                    selectedFormat === option.id
                      ? "border-[#FF6933] bg-white shadow-md"
                      : "border-[#E8E4DD] bg-white hover:shadow-md"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: option.accentColor }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {option.id === "showroom" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      )}
                      {option.id === "online" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                      {option.id === "site_visit" && (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </>
                      )}
                    </svg>
                  </div>
                  <h3 className="font-bold text-[#1A1A1A]">{option.title}</h3>
                  <p className="mt-1.5 text-sm text-[#8A8580] leading-relaxed">{option.description}</p>
                  {selectedFormat === option.id && (
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#FF6933]">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      Geselecteerd
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedFormat && (
            <>
              {/* AM info */}
              {selectedFormat === "showroom" && (
                <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-xl border border-[#E8E4DD]">
                  <div className="w-10 h-10 rounded-full bg-[#1A7A6B] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">RP</div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">Je gesprek is met {AM_CONFIG[0].name}</p>
                    <p className="text-sm text-[#8A8580]">{AM_CONFIG[0].role}</p>
                  </div>
                </div>
              )}
              {selectedFormat === "online" && (
                <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-xl border border-[#E8E4DD]">
                  <div className="flex -space-x-2">
                    {AM_CONFIG.map((am) => (
                      <div key={am.email} className="w-10 h-10 rounded-full bg-[#FF6933] flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                        {am.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">Je spreekt met {AM_CONFIG.map((a) => a.name.split(" ")[0]).join(" of ")}</p>
                    <p className="text-sm text-[#8A8580]">Beschikbaarheid hangt af van de gekozen datum</p>
                  </div>
                </div>
              )}
              {selectedFormat === "site_visit" && (
                <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-xl border border-[#E8E4DD]">
                  <div className="flex -space-x-2">
                    {AM_CONFIG.map((am) => (
                      <div key={am.email} className="w-10 h-10 rounded-full bg-[#97B9BF] flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                        {am.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">Een van onze account managers neemt contact met je op</p>
                    <p className="text-sm text-[#8A8580]">We plannen samen een geschikt moment in</p>
                  </div>
                </div>
              )}

              {/* Step 2: Contact details */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-[#1A1A1A]">Je gegevens</h2>
                <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField name="partnerName" label="Naam" required placeholder="Jan de Vries" defaultValue={prefill.name} />
                    <InputField name="companyName" label="Bedrijfsnaam" required placeholder="Installatiebedrijf BV" defaultValue={prefill.company} />
                    <InputField name="partnerEmail" label="E-mailadres" type="email" required placeholder="jan@bedrijf.nl" defaultValue={prefill.email} />
                    <InputField name="partnerPhone" label="Telefoonnummer" type="tel" required placeholder="06-12345678" defaultValue={prefill.phone} />
                  </div>
                </div>
              </div>

              {/* Step 3: Slot picker (showroom / online) */}
              {needsSlotPicker && (
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Kies een datum en tijd</h2>

                  {selectedFormat === "showroom" && (
                    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#1A7A6B] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-[#1A1A1A]">Quatt B.V.</p>
                          <p className="text-[#8A8580]">Kon. Wilhelminaplein 29, 1062HJ Amsterdam</p>
                        </div>
                      </div>
                    </div>
                  )}

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
                        onChange={handleDateChange}
                        className="w-full sm:w-72 rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
                      />
                      {selectedDate && (
                        <p className="mt-2 text-sm text-[#8A8580]">{formatDateNL(selectedDate)}</p>
                      )}
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
              )}

              {/* Step 3 alt: Callback flow (site_visit) */}
              {selectedFormat === "site_visit" && (
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Waar en wanneer?</h2>
                  <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 space-y-4">
                    <InputField name="location" label="Adres (bezoeklocatie)" required placeholder="Straatnaam 1, 1234AB Plaatsnaam" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField name="preferredDate" label="Voorkeursweek" type="date" required min={minDateStr} />
                      <div>
                        <label htmlFor="preferredTimeSlot" className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">
                          Voorkeurstijd<span className="text-[#FF6933] ml-0.5">*</span>
                        </label>
                        <select
                          id="preferredTimeSlot"
                          name="preferredTimeSlot"
                          required
                          className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
                        >
                          <option value="">Kies een moment</option>
                          <option value="morning">Ochtend (9:00 - 12:00)</option>
                          <option value="afternoon">Middag (13:00 - 17:00)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-[#E8E4DD] p-6">
                  <label htmlFor="notes" className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">Opmerkingen</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Waar wil je het over hebben? Heb je al ervaring met warmtepompen?"
                    className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200 resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (needsSlotPicker && !selectedSlot)}
                className="w-full bg-[#FF6933] text-white font-semibold rounded-full px-8 py-3.5 text-base hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

// --- Reusable input component ---

function InputField({
  name, label, type = "text", required, placeholder, defaultValue, min,
}: {
  name: string; label: string; type?: string; required?: boolean;
  placeholder?: string; defaultValue?: string; min?: string;
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
        min={min}
        className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
      />
    </div>
  );
}
