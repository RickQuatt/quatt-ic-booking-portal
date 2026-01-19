import { motion } from "framer-motion";
import { staggerContainerVariants } from "@/lib/animations";
import { ChecklistItem } from "./ChecklistItem";

export interface ChecklistItemsViewProps {
  data: { [key: string]: string | string[] } | null | undefined;
  className?: string;
}

/**
 * ChecklistItemsView - Container for displaying all checklist items
 * Provides a grid layout with zebra striping
 *
 * @example
 * ```tsx
 * <ChecklistItemsView
 *   data={{
 *     "Inspector": "John Doe",
 *     "Condition": "Good",
 *     "Documentation": "https://example.com/docs.pdf"
 *   }}
 * />
 * ```
 */
export function ChecklistItemsView({
  data,
  className = "",
}: ChecklistItemsViewProps) {
  // Empty state
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground italic">
        No checklist data available
      </div>
    );
  }

  const entries = Object.entries(data);

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className={`border border-border rounded-lg overflow-hidden bg-white dark:bg-dark-foreground ${className}`}
    >
      {entries.map(([question, answer], index) => (
        <div
          key={question}
          className={
            index % 2 === 0
              ? "bg-gray-50 dark:bg-gray-800/50"
              : "bg-white dark:bg-dark-foreground"
          }
        >
          <ChecklistItem question={question} answer={answer} />
        </div>
      ))}
    </motion.div>
  );
}
