import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
  /** Lift the shadow on hover -- use for interactive (clickable) cards. */
  interactive?: boolean;
  /** Pad less, for compact cards. Default = p-5. */
  compact?: boolean;
}

/**
 * Quatt Card -- rounded-[14px] white surface with a subtle border and card shadow.
 * Matches the AM Toolkit design language. Use for all grouped content on booking
 * pages. Pair with `<SectionLabel>` for headings and `<InputField>` for forms.
 */
export function Card({ className, children, interactive, compact }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-[14px] border border-quatt-border-light shadow-card",
        compact ? "p-4" : "p-5",
        interactive &&
          "hover:shadow-card-hover transition-shadow duration-150 cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Small-caps uppercase section label, matches AM Toolkit's `text-[11px] font-semibold
 * uppercase tracking-wider text-quatt-text-secondary` pattern.
 */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold uppercase tracking-wider text-quatt-text-secondary mb-3",
        className,
      )}
    >
      {children}
    </h2>
  );
}
