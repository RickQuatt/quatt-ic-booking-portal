import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { ThemedJsonView } from "@/components/shared/ThemedJsonView";

export interface ChecklistSectionProps {
  title: string;
  data: { [key: string]: string | string[] } | null | undefined;
  defaultExpanded?: boolean;
}

/**
 * ChecklistSection - Displays checklist JSON data in a collapsible accordion
 *
 * @example
 * ```tsx
 * <ChecklistSection
 *   title="Check-in Checklist"
 *   data={{ "Inspector": "John Doe", "Condition": "Good" }}
 * />
 * ```
 */
export function ChecklistSection({
  title,
  data,
  defaultExpanded = false,
}: ChecklistSectionProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No checklist data available
      </p>
    );
  }

  const itemCount = Object.keys(data).length;
  const displayTitle = `${title} (${itemCount} ${itemCount === 1 ? "item" : "items"})`;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultExpanded ? "checklist" : undefined}
    >
      <AccordionItem value="checklist" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline">
          <span className="font-semibold text-sm">{displayTitle}</span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <ThemedJsonView
            value={data}
            collapsed={2}
            displayDataTypes={false}
            showFullscreenButton={true}
            title={title}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
