/**
 * /book -- Booking hub.
 *
 * Two editorial sections:
 *   1. Trainingen -- Hybride, All-e, Quatt Chill (3 distinct curricula/events)
 *   2. Andere acties -- Kennismakingsgesprek, Eerste Installatie, Partnerovereenkomst
 *
 * Quatt Design Language:
 *   - Plus Jakarta Sans, ink #131A20, accent orange #FF6933
 *   - 999px pill CTAs, 16/1.55 body, generous tracking on display heads
 *   - Per-card brand-tinted halo for the icon
 */

interface CardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
  /** Hex color for the accent stroke + eyebrow + arrow. */
  accent: string;
  /** Soft halo colour (rgba) painted behind the icon + as a subtle corner glow. */
  halo: string;
  icon: React.ReactNode;
  /** External link (opens in new tab, e.g. Quatt Chill HubSpot RSVP). */
  external?: boolean;
}

function Arrow({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function Card({
  href,
  eyebrow,
  title,
  description,
  ctaText,
  accent,
  halo,
  icon,
  external,
}: CardProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group relative col-span-1 md:col-span-2 flex flex-col overflow-hidden rounded-[20px] bg-white border border-quatt-border-light p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(255,105,51,0.2)]"
      style={{
        boxShadow:
          "0 1px 2px rgba(19,26,32,0.03), 0 4px 16px -8px rgba(19,26,32,0.06)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-[260px] h-[260px] rounded-full opacity-40 transition-opacity duration-300 group-hover:opacity-75"
        style={{
          background: `radial-gradient(circle at center, ${halo} 0%, rgba(255,255,255,0) 65%)`,
        }}
      />
      <div className="relative flex flex-col flex-1">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
          style={{
            backgroundColor: halo,
            color: accent,
            boxShadow: `inset 0 0 0 1px ${accent}1f`,
          }}
        >
          {icon}
        </div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
        <h3 className="text-[19px] font-semibold text-quatt-ink tracking-[-0.02em] leading-snug">
          {title}
        </h3>
        <p className="mt-2 text-[14px] text-quatt-text-secondary leading-[1.55] flex-1">
          {description}
        </p>
        <span
          className="inline-flex items-center gap-1.5 mt-5 text-[13px] font-semibold transition-all duration-200 group-hover:gap-2.5"
          style={{ color: accent }}
        >
          {ctaText}
          <Arrow className="w-3.5 h-3.5" />
        </span>
      </div>
    </a>
  );
}

function SectionHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="mb-5 md:mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="block w-6 h-px bg-quatt-orange" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-quatt-orange">
          {eyebrow}
        </p>
      </div>
      <h2 className="text-[24px] md:text-[28px] font-semibold text-quatt-ink tracking-[-0.03em] leading-[1.15]">
        {title}
      </h2>
      {intro && (
        <p className="mt-2 text-[15px] text-quatt-text-secondary leading-[1.55] max-w-2xl">
          {intro}
        </p>
      )}
    </div>
  );
}

export function BookingHubPage() {
  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-[#F7F5F0] overflow-hidden">
      {/* Ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(ellipse 1100px 600px at 15% -5%, rgba(255,105,51,0.08) 0%, rgba(247,245,240,0) 60%), radial-gradient(ellipse 800px 500px at 95% 110%, rgba(26,122,107,0.06) 0%, rgba(247,245,240,0) 55%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-14 md:py-20">
        {/* Hero */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-8 h-px bg-quatt-orange" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-quatt-orange">
              Quatt Installatiepartners
            </p>
          </div>
          <h1 className="text-[40px] md:text-[56px] font-semibold text-quatt-ink leading-[1.05] tracking-[-0.045em] max-w-3xl">
            Plan je training, gesprek of installatie.
          </h1>
          <p className="mt-5 text-[17px] md:text-[18px] text-quatt-text-secondary max-w-2xl leading-[1.6]">
            Kies hieronder wat je wilt boeken. Je ontvangt direct een bevestiging
            met alle details, en een uitnodiging in je agenda.
          </p>
        </header>

        {/* SECTION 1 -- Trainingen */}
        <section className="mb-14 md:mb-16">
          <SectionHeader
            eyebrow="Trainingen"
            title="Welke training past bij jou?"
            intro="Drie trainingstracks, ieder met een eigen focus. Kies de variant die aansluit bij wat je installeert of wilt leren."
          />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
            <Card
              href="/book/training"
              eyebrow="Hybride"
              title="Hybride Installatietraining"
              description="De standaard Quatt-training. Leer in één dag alles over het installeren en in bedrijf stellen van de Quatt Hybride warmtepomp. Inclusief lunch, certificaat en directe Q&A met de trainer."
              ctaText="Hybride boeken"
              accent="#FF6933"
              halo="rgba(255,105,51,0.10)"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <Card
              href="/book/training/alle"
              eyebrow="All-Electric"
              title="All-e Installatietraining"
              description="Speciaal voor partners die de Quatt All-Electric warmtepomp gaan installeren. Verdiepende stof over warmteterugwinning, hydraulisch ontwerp en commissioning."
              ctaText="All-e boeken"
              accent="#2D6CDF"
              halo="rgba(45,108,223,0.10)"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              }
            />
            <Card
              href="/book/training/chill"
              eyebrow="Event"
              title="Quatt Chill Night"
              description="Productlancering Quatt Chill -- het koelsysteem voor je hybride en All-e installaties. Product-, verkoop- en installatietraining in één avond, met borrel na. Op 20 mei in onze showroom."
              ctaText="Aanmelden"
              accent="#4A90A4"
              halo="rgba(74,144,164,0.12)"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364" />
                </svg>
              }
            />
          </div>
        </section>

        {/* SECTION 2 -- Andere acties */}
        <section>
          <SectionHeader
            eyebrow="Verder met Quatt"
            title="Gesprek, installatie of overeenkomst"
          />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
            <Card
              href="/book/kennismaking"
              eyebrow="Kennismaken"
              title="Kennismakingsgesprek"
              description="Plan een gesprek met een Quatt account manager. Showroom, online of bij jou op locatie -- jij kiest."
              ctaText="Gesprek plannen"
              accent="#1A7A6B"
              halo="rgba(26,122,107,0.10)"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
            <Card
              href="/book/install"
              eyebrow="Begeleiding"
              title="Eerste Installatie"
              description="Vraag begeleiding aan bij je eerste Quatt installatie. Een account manager komt ter plaatse meehelpen."
              ctaText="Installatie aanvragen"
              accent="#7A5BD0"
              halo="rgba(122,91,208,0.10)"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437" />
                </svg>
              }
            />
            <Card
              href="/book/agreement"
              eyebrow="Administratie"
              title="Partnerovereenkomst"
              description="Onderteken de Quatt distributieovereenkomst digitaal. Vul je bedrijfsgegevens in en plaats je handtekening."
              ctaText="Overeenkomst tekenen"
              accent="#131A20"
              halo="rgba(19,26,32,0.06)"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Footer trust line */}
        <div className="mt-14 md:mt-16 flex items-center gap-3 text-[13px] text-quatt-text-secondary">
          <svg className="w-4 h-4 text-quatt-orange" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Vragen? Neem contact op met je account manager of bel{" "}
          <a href="tel:+31208082116" className="font-semibold text-quatt-ink hover:text-quatt-orange transition-colors">
            020 808 2116
          </a>
        </div>
      </div>
    </div>
  );
}
