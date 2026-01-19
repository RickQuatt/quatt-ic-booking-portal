import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { isValidUrl } from "@/utils/urlUtils";
import { ExternalLink } from "lucide-react";

export interface ChecklistItemProps {
  question: string;
  answer: string | string[];
  className?: string;
}

/**
 * ChecklistItem - Renders a single checklist question-answer pair
 * Detects URLs and displays them as clickable links
 * Displays text values as badges
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
      className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border-b border-border last:border-b-0 ${className}`}
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
              <Button
                key={index}
                variant="link"
                size="sm"
                asChild
                className="h-auto p-0 text-sm"
              >
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline break-all"
                >
                  {value}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </Button>
            );
          }

          return (
            <Badge
              key={index}
              variant="outline"
              className="text-sm font-normal"
            >
              {value || "(empty)"}
            </Badge>
          );
        })}
      </div>
    </motion.div>
  );
}
