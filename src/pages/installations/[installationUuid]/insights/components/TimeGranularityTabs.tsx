import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type { TimeGranularity } from "../types/insights.types";

const TABS: { label: string; value: TimeGranularity }[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
];

interface TimeGranularityTabsProps {
  selected: TimeGranularity;
  onTabPress: (value: TimeGranularity) => void;
}

export function TimeGranularityTabs({
  selected,
  onTabPress,
}: TimeGranularityTabsProps) {
  return (
    <Tabs
      value={selected}
      onValueChange={(v) => onTabPress(v as TimeGranularity)}
    >
      <TabsList className="w-full">
        {TABS.map(({ label, value }) => (
          <TabsTrigger key={value} value={value} className="flex-1">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
