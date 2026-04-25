/**
 * /book/agreement -- Partner agreement form with signature.
 *
 * The canonical agreement text is baked into the bundle (see functions/lib/agreement-content.ts).
 * Form prefills company + email from URL params, captures a drawn signature via
 * react-signature-canvas, and on submit the backend generates a PDF emailed to the partner.
 */

import { useState, useRef, useMemo } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  AGREEMENT_VERSION,
  AGREEMENT_UPDATED_AT,
} from "../../../agreement-static";

function getSearchParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) || "";
}

export function AgreementPage() {
  const dealId = getSearchParam("dealId");
  const prefillEmail = getSearchParam("email");
  const prefillCompany = getSearchParam("company");
  const version = getSearchParam("version") || AGREEMENT_VERSION;

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    companyName: string;
    downloadUrl: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [acceptAgreement, setAcceptAgreement] = useState(false);
  const sigRef = useRef<SignatureCanvas | null>(null);

  const updatedAtLabel = useMemo(() => {
    try {
      return new Date(AGREEMENT_UPDATED_AT + "T00:00:00Z").toLocaleDateString(
        "nl-NL",
        { day: "numeric", month: "long", year: "numeric" },
      );
    } catch {
      return AGREEMENT_UPDATED_AT;
    }
  }, []);

  const canSubmit = !submitting && !!signatureDataUrl && acceptAgreement;

  function handleClearSignature() {
    sigRef.current?.clear();
    setSignatureDataUrl(null);
  }

  function handleSignatureEnd() {
    const pad = sigRef.current;
    if (!pad || pad.isEmpty()) {
      setSignatureDataUrl(null);
      return;
    }
    const dataUrl = pad.getTrimmedCanvas().toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!signatureDataUrl) {
      setError("Plaats je handtekening om door te gaan.");
      return;
    }
    if (!acceptAgreement) {
      setError("Bevestig dat je akkoord gaat met de partnerovereenkomst.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      companyName: form.get("companyName"),
      kvkNumber: form.get("kvkNumber"),
      btwNumber: form.get("btwNumber"),
      contactPerson: form.get("contactPerson"),
      email: form.get("email"),
      phone: form.get("phone"),
      address: form.get("address"),
      postcode: form.get("postcode"),
      city: form.get("city"),
      signature: signatureDataUrl,
      acceptTerms: acceptAgreement,
      acceptDistribution: acceptAgreement,
      dealId,
      version,
    };

    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Ondertekening mislukt.");
        setSubmitting(false);
        return;
      }

      setResult(json.agreement);
    } catch {
      setError("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="rounded-[14px] bg-[#e8f5e9] border border-[#1A7A6B]/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8 text-[#2e7d32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-5 text-[22px] font-semibold text-[#1b5e20] tracking-[-0.02em]">
            Overeenkomst ondertekend
          </h1>
          <p className="mt-2 text-[15px] text-[#2e7d32]">
            Bedankt, {result.companyName}. Je ontvangt de ondertekende overeenkomst per e-mail.
          </p>
          <p className="mt-4 text-[14px] text-[#545454]">
            Je Quatt partnermanager neemt binnen enkele dagen contact op voor de volgende stappen.
          </p>

          {result.downloadUrl && (
            <a
              href={result.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 bg-[#FF6933] text-white font-semibold rounded-full px-6 py-3 text-[15px] hover:brightness-95 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download ondertekende overeenkomst
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="rounded-[14px] bg-[#E8EEEE] p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-white/70 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#1A7A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h4m2-12H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-6-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#131A20] tracking-[-0.04em]">
              Quatt Partnerovereenkomst
            </h1>
            <p className="mt-1 text-[15px] text-[#131A20]/70 leading-relaxed">
              Lees de overeenkomst, controleer je bedrijfsgegevens en onderteken onderaan.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section>
          <h2 className="text-[16px] font-semibold text-[#131A20] mb-4">Bedrijfsgegevens</h2>
          <div className="bg-white rounded-[14px] border border-[#E8E4DD] p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                name="companyName"
                label="Bedrijfsnaam"
                required
                placeholder="Installatiebedrijf BV"
                defaultValue={prefillCompany}
              />
              <InputField name="kvkNumber" label="KvK-nummer" required placeholder="12345678" />
              <InputField name="btwNumber" label="BTW-nummer" required placeholder="NL123456789B01" />
              <InputField name="contactPerson" label="Contactpersoon" required placeholder="Jan de Vries" />
              <InputField
                name="email"
                label="E-mailadres"
                type="email"
                required
                placeholder="jan@bedrijf.nl"
                defaultValue={prefillEmail}
              />
              <InputField name="phone" label="Telefoonnummer" type="tel" required placeholder="06-12345678" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold text-[#131A20] mb-4">Adres</h2>
          <div className="bg-white rounded-[14px] border border-[#E8E4DD] p-6 space-y-4">
            <InputField name="address" label="Straat en huisnummer" required placeholder="Keizersgracht 123" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField name="postcode" label="Postcode" required placeholder="1015 CJ" />
              <InputField name="city" label="Plaats" required placeholder="Amsterdam" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold text-[#131A20] mb-4">De overeenkomst</h2>
          <div className="bg-white rounded-[14px] border border-[#E8E4DD] p-6">
            <p className="text-[15px] text-[#131A20]/85 leading-relaxed">
              Deze overeenkomst regelt de samenwerking tussen jou als installatiepartner en
              Quatt Installaties B.V. Je tekent een raamovereenkomst waarin onder andere het volgende is vastgelegd:
            </p>
            <ul className="mt-4 space-y-2 text-[14px] text-[#131A20]/85">
              <li className="flex gap-3">
                <span className="text-[#FF6933] font-bold shrink-0">—</span>
                <span>Werkzaamheden, opdrachten en oplevering van installaties</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#FF6933] font-bold shrink-0">—</span>
                <span>Prijzen, facturering en betalingstermijnen (BIJLAGE 3)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#FF6933] font-bold shrink-0">—</span>
                <span>Verantwoordelijkheden, aansprakelijkheid en verzekering</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#FF6933] font-bold shrink-0">—</span>
                <span>Anti-concurrentie-, anti-corruptie- en vertrouwelijkheidsbepalingen</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#FF6933] font-bold shrink-0">—</span>
                <span>Verwerkersovereenkomst (BIJLAGE 4) en The Quatt Way of Working (BIJLAGE 5)</span>
              </li>
            </ul>
            <a
              href={`/api/agreement/${AGREEMENT_VERSION}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 bg-[#131A20] text-white rounded-full px-5 py-3 text-[14px] font-semibold hover:bg-[#1A1A1A] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Lees de volledige overeenkomst (PDF)
            </a>
            <p className="mt-3 text-[12px] text-[#8A8580]">
              Versie {AGREEMENT_VERSION} · laatst herzien {updatedAtLabel}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold text-[#131A20] mb-4">Akkoord</h2>
          <div className="bg-white rounded-[14px] border border-[#E8E4DD] p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptAgreement}
                onChange={(e) => setAcceptAgreement(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-2 border-[#E8E4DD] accent-[#FF6933] shrink-0"
              />
              <span className="text-[14px] text-[#131A20]/85 leading-relaxed">
                Ik heb de Quatt partnerovereenkomst (versie {AGREEMENT_VERSION}) gelezen en ga
                akkoord met alle bepalingen, inclusief de anti-concurrentie-, anti-corruptie- en
                vertrouwelijkheidsbepalingen.
              </span>
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold text-[#131A20] mb-4">Ondertekening</h2>
          <div className="bg-white rounded-[14px] border border-[#E8E4DD] p-6">
            <p className="text-[14px] text-[#8A8580] mb-3">
              Teken je handtekening hieronder. Gebruik de muis of vingertop.
            </p>
            <div className="relative border-[1.5px] border-dashed border-[#E8E4DD] rounded-[12px] bg-[#FAFAF7] overflow-hidden">
              <SignatureCanvas
                ref={(r) => {
                  sigRef.current = r;
                }}
                penColor="#1A1A1A"
                onEnd={handleSignatureEnd}
                canvasProps={{
                  className: "w-full h-[180px] touch-none cursor-crosshair block",
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[12px] text-[#8A8580]">
                {signatureDataUrl ? "Handtekening geplaatst." : "Nog geen handtekening."}
              </p>
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-[13px] text-[#8A8580] hover:text-[#131A20] transition-colors"
              >
                Wissen en opnieuw tekenen
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 text-[14px] text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-[#FF6933] text-white font-semibold rounded-full px-6 py-3.5 text-[15px] hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          {submitting ? "Bezig met ondertekenen..." : "Overeenkomst ondertekenen"}
        </button>

        <p className="text-[12px] text-[#8A8580] text-center">
          Door te ondertekenen ga je akkoord met versie {AGREEMENT_VERSION} van de Quatt partnerovereenkomst.
          Je ontvangt een kopie per e-mail.
        </p>
      </form>
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
      <label htmlFor={name} className="block text-[13px] font-semibold text-[#131A20] mb-1.5">
        {label}
        {required && <span className="text-[#FF6933] ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-[10px] bg-white px-4 py-3 text-[16px] text-[#131A20] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] focus:ring-2 focus:ring-[#FF6933]/20 transition-colors duration-150"
      />
    </div>
  );
}
