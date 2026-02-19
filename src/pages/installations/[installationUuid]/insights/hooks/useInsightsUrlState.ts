import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { format, parse, isValid, startOfDay } from "date-fns";
import type { TimeGranularity } from "../types/insights.types";

interface UseInsightsUrlStateParams {
  selectedDate: Date;
  selectedTimeGranularity: TimeGranularity;
  minimumDate: Date;
  maximumDate: Date;
  onDateChange: (date: Date) => void;
  onTimeGranularityChange: (granularity: TimeGranularity) => void;
}

const TIME_GRANULARITIES: TimeGranularity[] = [
  "day",
  "week",
  "month",
  "year",
  "all",
];

/**
 * Hook to sync insights state with URL parameters
 * URL format: ?date=YYYY-MM-DD&granularity=day
 */
export function useInsightsUrlState({
  selectedDate,
  selectedTimeGranularity,
  minimumDate,
  maximumDate,
  onDateChange,
  onTimeGranularityChange,
}: UseInsightsUrlStateParams) {
  const [location, setLocation] = useLocation();

  // Initialize state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    const granularityParam = params.get("granularity");

    let hasChanges = false;

    // Parse and validate date from URL
    if (dateParam) {
      try {
        const parsedDate = parse(dateParam, "yyyy-MM-dd", new Date());
        if (
          isValid(parsedDate) &&
          parsedDate >= minimumDate &&
          parsedDate <= maximumDate
        ) {
          onDateChange(startOfDay(parsedDate));
          hasChanges = true;
        }
      } catch {
        // Intentionally ignore malformed date URLs - graceful degradation
        // User will see default date instead of breaking the page
      }
    }

    // Parse and validate granularity from URL
    if (
      granularityParam &&
      TIME_GRANULARITIES.includes(granularityParam as TimeGranularity)
    ) {
      onTimeGranularityChange(granularityParam as TimeGranularity);
      hasChanges = true;
    }
  }, [minimumDate, maximumDate, onDateChange, onTimeGranularityChange]);

  // Update URL when state changes
  const updateUrl = useCallback(
    (date: Date, granularity: TimeGranularity) => {
      const params = new URLSearchParams(window.location.search);
      const dateStr = format(date, "yyyy-MM-dd");

      params.set("date", dateStr);
      params.set("granularity", granularity);

      const newUrl = `${location.split("?")[0]}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    },
    [location],
  );

  // Sync URL when state changes
  useEffect(() => {
    updateUrl(selectedDate, selectedTimeGranularity);
  }, [selectedDate, selectedTimeGranularity, updateUrl]);

  return { updateUrl };
}
