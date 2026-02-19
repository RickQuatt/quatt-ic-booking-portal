import { format, startOfWeek, endOfWeek, startOfDay } from "date-fns";
import type { TimeGranularity } from "../types/insights.types";

/**
 * Format a power value (in Watt-hours) to an appropriate unit.
 * Ported from mobile app: src/utils/insights.ts
 */
export function formatPower(valueInWatt?: number | null): {
  label: string;
  value: string;
} {
  if (!valueInWatt) {
    return { label: "", value: "0" };
  }

  const units = [
    { threshold: 1_000_000, label: "MWh", divisor: 1_000_000 },
    { threshold: 1_000, label: "kWh", divisor: 1_000 },
    { threshold: 0, label: "Wh", divisor: 1 },
  ];

  const { label, divisor } = units.find(
    ({ threshold }) => valueInWatt >= threshold,
  )!;
  const value = valueInWatt / divisor;
  const formattedValue =
    value % 1 ? value.toFixed(2) : Math.round(value).toString();

  return { label, value: formattedValue };
}

/**
 * Format power value as a combined string (e.g., "2.98 MWh").
 */
export function formatPowerString(valueInWatt?: number | null): string {
  const { value, label } = formatPower(valueInWatt);
  if (!label) return `${value} Wh`;
  return `${value} ${label}`;
}

/**
 * Get the minimum Y-axis value for each time granularity.
 * Ported from mobile app: src/utils/insights.ts
 */
export function minimumYAxisValueForTimeGranularity(
  timeGranularity: TimeGranularity,
): number {
  switch (timeGranularity) {
    case "day":
      return 100;
    case "week":
      return 2000;
    case "month":
      return 16_000;
    default:
      return 100_000;
  }
}

/**
 * Round large measurements: >= 100 rounds to integer, < 100 keeps decimals.
 * Ported from mobile app: src/utils/insights.ts
 */
export function roundLargeMeasurement(value: number): number {
  return value >= 100 ? Math.round(value) : value;
}

/**
 * Format the date display title based on the current time granularity.
 * Ported from mobile app CalendarNavigation presenter.
 */
export function formatDateTitle(
  date: Date,
  timeGranularity: TimeGranularity,
): string {
  switch (timeGranularity) {
    case "day":
      return format(date, "EEE d MMMM");
    case "week": {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      return `Week ${format(weekStart, "w")}`;
    }
    case "month":
      return format(date, "MMMM");
    case "year":
      return format(date, "yyyy");
    case "all":
      return "All time";
  }
}

/**
 * Format the date display subtitle.
 */
export function formatDateSubtitle(
  date: Date,
  timeGranularity: TimeGranularity,
  minimumDate?: Date,
  maximumDate?: Date,
): string | undefined {
  switch (timeGranularity) {
    case "day":
      return format(date, "yyyy");
    case "week": {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = startOfDay(endOfWeek(date, { weekStartsOn: 1 }));
      return `${format(weekStart, "dd/MM/yy")} - ${format(weekEnd, "dd/MM/yy")}`;
    }
    case "month":
      return format(date, "yyyy");
    case "year":
      return undefined;
    case "all":
      if (minimumDate && maximumDate) {
        return `${format(minimumDate, "yyyy")} - ${format(maximumDate, "yyyy")}`;
      }
      return undefined;
  }
}

/**
 * Format a graph timestamp label based on the time granularity.
 */
export function formatTickLabel(
  timestamp: string,
  timeGranularity: TimeGranularity,
): string {
  const date = new Date(timestamp);
  switch (timeGranularity) {
    case "day":
      return format(date, "HH:mm");
    case "week":
      return format(date, "EEE");
    case "month":
      return format(date, "d");
    case "year":
      return format(date, "MMM");
    case "all":
      return format(date, "yyyy");
  }
}

/**
 * Ensure a value is zero or positive.
 */
export function positiveOrZero(value?: number | null): number {
  if (value == null || value < 0) return 0;
  return value;
}

/**
 * Check if a value is positive (> 0) and defined.
 */
export function isPositive(value?: number | null): boolean {
  return value != null && value > 0;
}

/**
 * Format currency value for savings display.
 */
export function formatCurrency(value?: number | null): string {
  if (value == null) return "€0.00";
  return `€${Math.abs(value).toFixed(2)}`;
}
