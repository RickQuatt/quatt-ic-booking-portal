/**
 * /book/agreement -- Partner agreement form with signature.
 */

import { useState, useRef, useCallback } from "react";

function getSearchParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) || "";
}

export function AgreementPage() {
  const dealId = getSearchParam("dealId");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; companyName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptDistribution, setAcceptDistribution] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!signature) {
      setError("Plaats je handtekening om door te gaan.");
      return;
    }
    if (!acceptTerms || !acceptDistribution) {
      setError("Accepteer de algemene voorwaarden en distributieovereenkomst.");
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
      signature,
      acceptTerms,
      acceptDistribution,
      dealId,
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
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1A7A6B]/10 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#1A7A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#1A1A1A]">Overeenkomst ondertekend!</h1>
        <div className="mt-6 bg-white rounded-xl border border-[#E8E4DD] p-5 text-left">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-2 text-[#8A8580] pr-4">Bedrijf</td>
                <td className="py-2 font-semibold">{result.companyName}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[#8A8580]">
          Bedankt voor het ondertekenen. Je Quatt partnermanager neemt contact met je op voor de volgende stappen.
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">Partnerovereenkomst</h1>
          <p className="mt-3 text-[#8A8580] max-w-lg leading-relaxed">
            Vul je bedrijfsgegevens in en onderteken de Quatt distributieovereenkomst.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Bedrijfsgegevens</h2>
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField name="companyName" label="Bedrijfsnaam" required placeholder="Installatiebedrijf BV" />
                <InputField name="kvkNumber" label="KvK-nummer" required placeholder="12345678" />
                <InputField name="btwNumber" label="BTW-nummer" required placeholder="NL123456789B01" />
                <InputField name="contactPerson" label="Contactpersoon" required placeholder="Jan de Vries" />
                <InputField name="email" label="E-mailadres" type="email" required placeholder="jan@bedrijf.nl" />
                <InputField name="phone" label="Telefoonnummer" type="tel" required placeholder="06-12345678" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Adres</h2>
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 space-y-4">
              <InputField name="address" label="Straat en huisnummer" required placeholder="Keizersgracht 123" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField name="postcode" label="Postcode" required placeholder="1015 CJ" />
                <InputField name="city" label="Plaats" required placeholder="Amsterdam" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Voorwaarden</h2>
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 space-y-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-[#E8E4DD] accent-[#FF6933]"
                />
                <span className="text-sm text-[#1A1A1A]/80 leading-relaxed">
                  Ik ga akkoord met de{" "}
                  <a href="https://quatt.io/algemene-voorwaarden" target="_blank" rel="noopener noreferrer" className="text-[#FF6933] font-semibold underline">
                    algemene voorwaarden
                  </a>{" "}
                  van Quatt.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptDistribution}
                  onChange={(e) => setAcceptDistribution(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-[#E8E4DD] accent-[#FF6933]"
                />
                <span className="text-sm text-[#1A1A1A]/80 leading-relaxed">
                  Ik ga akkoord met de Quatt distributieovereenkomst, inclusief de anti-concurrentie- en anti-corruptiebepalingen.
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Ondertekening</h2>
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-6">
              <SignaturePad onSignatureChange={setSignature} />
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
            {submitting ? "Bezig met ondertekenen..." : "Overeenkomst ondertekenen"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Simple signature pad using canvas ---

function SignaturePad({ onSignatureChange }: { onSignatureChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    return ctx;
  }, []);

  function getPosition(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = getContext();
    if (!ctx) return;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getContext();
    if (!ctx) return;
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function stopDrawing() {
    if (isDrawing) {
      setIsDrawing(false);
      if (canvasRef.current && hasDrawn) {
        onSignatureChange(canvasRef.current.toDataURL("image/png"));
      }
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureChange(null);
  }

  return (
    <div>
      <p className="text-sm text-[#8A8580] mb-3">Teken je handtekening hieronder</p>
      <div className="relative border-2 border-dashed border-[#E8E4DD] rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={560}
          height={160}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[#E8E4DD] text-sm">Teken hier je handtekening</p>
          </div>
        )}
      </div>
      {hasDrawn && (
        <button
          type="button"
          onClick={clearSignature}
          className="mt-2 text-sm text-[#8A8580] hover:text-[#1A1A1A] transition-colors"
        >
          Wissen en opnieuw tekenen
        </button>
      )}
    </div>
  );
}

function InputField({
  name, label, type = "text", required, placeholder,
}: {
  name: string; label: string; type?: string; required?: boolean; placeholder?: string;
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
        className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
      />
    </div>
  );
}
