/**
 * /book -- Booking hub with 4 cards for the different booking types.
 */

function BookingCard({
  href,
  title,
  description,
  accentColor,
  icon,
  ctaText,
}: {
  href: string;
  title: string;
  description: string;
  accentColor: string;
  icon: React.ReactNode;
  ctaText: string;
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-5 p-6 bg-white rounded-xl border-2 border-[#E8E4DD] hover:shadow-md hover:border-[#FF6933]/40 transition-all duration-200 group"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accentColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-[#1A1A1A] text-lg">{title}</h3>
        <p className="mt-1.5 text-sm text-[#8A8580] leading-relaxed">{description}</p>
        <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#FF6933] group-hover:gap-2.5 transition-all duration-200">
          {ctaText}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </a>
  );
}

export function BookingHubPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-[1.1] tracking-tight max-w-2xl">
            Plan je training, gesprek of eerste installatie.
          </h1>
          <p className="mt-4 text-lg text-[#8A8580] max-w-lg leading-relaxed">
            Kies hieronder wat je wilt boeken. Je ontvangt direct een bevestiging.
          </p>
        </div>
      </section>

      {/* Booking options */}
      <section className="bg-[#F7F5F0]">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <div className="space-y-4">
            <BookingCard
              href="/book/training"
              title="Installatie Training"
              description="Boek een plek bij een Quatt installatie training. Leer alles over het installeren van de Quatt warmtepomp."
              accentColor="#1A7A6B"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              ctaText="Training boeken"
            />
            <BookingCard
              href="/book/kennismaking"
              title="Kennismakingsgesprek"
              description="Plan een kennismakingsgesprek met een Quatt account manager. Kies voor showroom, online of een locatiebezoek."
              accentColor="#FF6933"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
              ctaText="Gesprek plannen"
            />
            <BookingCard
              href="/book/install"
              title="Eerste Installatie"
              description="Vraag begeleiding aan bij je eerste Quatt installatie. Een account manager komt ter plaatse meehelpen."
              accentColor="#97B9BF"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              ctaText="Installatie aanvragen"
            />
            <BookingCard
              href="/book/agreement"
              title="Partnerovereenkomst"
              description="Onderteken de Quatt distributieovereenkomst digitaal. Vul je bedrijfsgegevens in en plaats je handtekening."
              accentColor="#131A20"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              ctaText="Overeenkomst tekenen"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
