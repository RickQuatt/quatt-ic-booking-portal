import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from "lucide-react";
import type { TimeGranularity } from "../types/insights.types";
import {
  formatDateTitle,
  formatDateSubtitle,
} from "../utils/insightsFormatting";

interface DateNavigationBarProps {
  date: Date;
  timeGranularity: TimeGranularity;
  minimumDate: Date;
  maximumDate: Date;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
  isNowDisabled: boolean;
  isCalendarDisabled: boolean;
  isFetching: boolean;
  onPreviousPress: () => void;
  onNextPress: () => void;
  onNowPress: () => void;
  onCalendarPress: () => void;
  onRefresh: () => void;
}

export function DateNavigationBar({
  date,
  timeGranularity,
  minimumDate,
  maximumDate,
  isPreviousDisabled,
  isNextDisabled,
  isNowDisabled,
  isCalendarDisabled,
  isFetching,
  onPreviousPress,
  onNextPress,
  onNowPress,
  onCalendarPress,
  onRefresh,
}: DateNavigationBarProps) {
  const title = formatDateTitle(date, timeGranularity);
  const subtitle = formatDateSubtitle(
    date,
    timeGranularity,
    minimumDate,
    maximumDate,
  );

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousPress}
          disabled={isPreviousDisabled}
          aria-label="Previous period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex min-w-[140px] flex-col items-center px-2">
          <span className="text-sm font-medium">{title}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onNextPress}
          disabled={isNextDisabled}
          aria-label="Next period"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onNowPress}
          disabled={isNowDisabled}
        >
          Today
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onCalendarPress}
          disabled={isCalendarDisabled}
          aria-label="Open date picker"
        >
          <Calendar className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          aria-label="Refresh data"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}
