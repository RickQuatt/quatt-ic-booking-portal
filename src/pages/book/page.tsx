/**
 * /book -- Booking hub with 4 cards for the different booking types.
 * Premium-utility design matching AM Toolkit: subtle cards, shadow-card, orange accent.
 */

function BookingCard({
  href,
  title,
  description,
  icon,
  iconBg,
  iconColor,
  ctaText,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  /** Background color for the icon tile. */
  iconBg: string;
  /** Stroke color for the icon itself. */
  iconColor: string;
  ctaText: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-start gap-5 p-5 bg-white rounded-[14px] border border-quatt-border-light shadow-card hover:shadow-card-hover transition-shadow duration-150"
    >
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[17px] font-semibold text-quatt-ink tracking-[-0.02em]">
          {title}
        </h3>
        <p className="mt-1 text-[14px] text-quatt-text-secondary leading-relaxed">
          {description}
        </p>
        <span className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-semibold text-quatt-orange group-hover:gap-2.5 transition-all duration-150">
          {ctaText}
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </div>
    </a>
  );
}

export function BookingHubPage() {
  return (
    <div className="bg-quatt-bg min-h-[calc(100vh-65px)]">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3">
            Quatt Installatiepartners
          </p>
          <h1 className="text-[32px] md:text-[40px] font-semibold text-quatt-ink leading-[1.1] tracking-[-0.04em]">
            Plan je training, gesprek of eerste installatie.
          </h1>
          <p className="mt-4 text-[16px] text-quatt-text-secondary max-w-lg leading-relaxed">
            Kies hieronder wat je wilt boeken. Je ontvangt direct een bevestiging
            met alle details.
          </p>
        </header>

        <div className="space-y-3">
          <BookingCard
            href="/book/training"
            title="Installatie Training"
            description="Boek een plek bij een Quatt installatie training. Leer alles over het installeren van de Quatt warmtepomp."
            iconBg="#ECFDF5"
            iconColor="#047857"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
            ctaText="Training boeken"
          />
          <BookingCard
            href="/book/kennismaking"
            title="Kennismakingsgesprek"
            description="Plan een kennismakingsgesprek met een Quatt account manager. Kies voor showroom, online of een locatiebezoek."
            iconBg="#FFF1EC"
            iconColor="#FF6933"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            }
            ctaText="Gesprek plannen"
          />
          <BookingCard
            href="/book/install"
            title="Eerste Installatie"
            description="Vraag begeleiding aan bij je eerste Quatt installatie. Een account manager komt ter plaatse meehelpen."
            iconBg="#EEF4F5"
            iconColor="#1A7A6B"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
            ctaText="Installatie aanvragen"
          />
          <BookingCard
            href="/book/agreement"
            title="Partnerovereenkomst"
            description="Onderteken de Quatt distributieovereenkomst digitaal. Vul je bedrijfsgegevens in en plaats je handtekening."
            iconBg="#F2F3F4"
            iconColor="#131A20"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            ctaText="Overeenkomst tekenen"
          />
        </div>
      </div>
    </div>
  );
}
