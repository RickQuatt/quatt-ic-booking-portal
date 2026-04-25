import { cn } from "@/lib/utils";

export interface BrandProps {
  className?: string;
  /** "text" displays full "Quatt" wordmark, "logo" displays only the Q */
  type?: "text" | "logo";
}

/**
 * Quatt Brand Logo Component
 * Inline SVG that inherits color from parent via `fill-current`.
 * Defaults to quatt-ink in light mode and white in dark mode -- never the lime
 * accent color, which was a template leftover that misrepresented the brand.
 *
 * @param type - "text" for full wordmark, "logo" for Q only (default: "text")
 */
export const Brand = ({ className, type = "text" }: BrandProps) => {
  const isLogo = type === "logo";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={isLogo ? "0 0 65 65" : "0 0 247.89 61.34"}
      className={cn(
        "fill-current text-quatt-ink dark:text-white",
        className,
      )}
      aria-label={isLogo ? "Quatt logo" : "Quatt"}
    >
      {/* Q logo - always shown */}
      <path
        fillRule="evenodd"
        d="M49.8,6.83a30.59,30.59,0,1,0-31.11,52,30,30,0,0,0,4.91,1.59,30.33,30.33,0,0,0,7,.81c.53,0,1.07,0,1.59,0H61a30.39,30.39,0,0,0-12.22-6c-.71-.17-1.43-.31-2.17-.43a31.88,31.88,0,0,0-4.82-.37H30.59a23.76,23.76,0,1,1,16.07-6.26h0A23.7,23.7,0,0,1,42.75,51a32.06,32.06,0,0,1,3.9.33l1.22.19a35.16,35.16,0,0,1,4.05,1,30.65,30.65,0,0,0,9.12-19c.09-1,.14-1.92.14-2.89A30.52,30.52,0,0,0,49.8,6.83Z"
      />
      {/* "uatt" letters - only shown for text variant */}
      {!isLogo && (
        <>
          <path
            fillRule="evenodd"
            d="M107.8,17.05V40.41a14,14,0,0,1-14,14h0a14,14,0,0,1-14-14V17.05a3.4,3.4,0,0,0-3.39-3.39H73.07V40.41A20.83,20.83,0,0,0,93.83,61.18h0a20.83,20.83,0,0,0,20.76-20.77V13.66H111.2A3.41,3.41,0,0,0,107.8,17.05Z"
          />
          <path
            fillRule="evenodd"
            d="M150.24,13.66a23.76,23.76,0,1,0,17,40.38v3.74a3.41,3.41,0,0,0,3.39,3.4H174V37.42A23.76,23.76,0,0,0,150.24,13.66Zm0,40.73a17,17,0,1,1,17-17A17,17,0,0,1,150.24,54.39Z"
          />
          <path
            fillRule="evenodd"
            d="M208.8,54.39h-.92a13.86,13.86,0,0,1-13.82-13.82V20.45h9.85a3.27,3.27,0,0,0,.7-.08,3.41,3.41,0,0,0,2.7-3.32V13.66H194.06V3.39A3.41,3.41,0,0,0,190.67,0h-3.4V40.57a20.67,20.67,0,0,0,20.61,20.61h4.31v-3.4A3.39,3.39,0,0,0,208.8,54.39Z"
          />
          <path
            fillRule="evenodd"
            d="M244.09,54.55h-.93a13.86,13.86,0,0,1-13.81-13.81V20.61h9.85a3.11,3.11,0,0,0,.69-.07,3.4,3.4,0,0,0,2.7-3.32v-3.4H229.35V3.56A3.41,3.41,0,0,0,226,.16h-3.39V40.74a20.66,20.66,0,0,0,20.6,20.6h4.32v-3.4A3.41,3.41,0,0,0,244.09,54.55Z"
          />
        </>
      )}
    </svg>
  );
};
