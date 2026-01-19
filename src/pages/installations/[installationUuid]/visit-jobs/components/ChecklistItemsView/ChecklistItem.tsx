import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { isValidUrl } from "@/utils/urlUtils";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistItemProps {
  question: string;
  answer: string | string[];
  className?: string;
}

/**
 * ChecklistItem - Renders a single checklist question-answer pair
 * Detects URLs and displays them as clickable links
 * Displays text values as plain text
 *
 * @example
 * ```tsx
 * <ChecklistItem
 *   question="Condition of equipment"
 *   answer="Good"
 * />
 * ```
 */
export function ChecklistItem({
  question,
  answer,
  className = "",
}: ChecklistItemProps) {
  // Normalize answer to always be an array
  const answers = Array.isArray(answer) ? answer : [answer];

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border-b border-border last:border-b-0",
        className,
      )}
    >
      {/* Question */}
      <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
        {question}
      </div>

      {/* Answer */}
      <div className="flex flex-wrap gap-2 items-start">
        {answers.map((value, index) => {
          const isUrl = typeof value === "string" && isValidUrl(value);

          if (isUrl) {
            return (
              <a
                key={index}
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all"
              >
                {value}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            );
          }

          return (
            <span
              key={index}
              className="text-sm font-normal text-gray-900 dark:text-gray-100"
            >
              {value || "(empty)"}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}
