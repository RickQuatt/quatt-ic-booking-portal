import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addHours,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  differenceInHours,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  isSameHour,
  isSameDay,
  isSameMonth,
  isSameYear,
  isBefore,
  format,
} from "date-fns";
import type {
  TimeGranularity,
  DateUnit,
  Tick,
  InsightsResponse,
} from "../types/insights.types";
import { INSIGHTS_TIME_UNITS, TICK_SPACER_RATIO } from "./insightsConstants";
import { positiveOrZero, isPositive } from "./insightsFormatting";

/**
 * Add a given number of units to a date.
 */
function addUnits(date: Date, amount: number, unit: DateUnit | "hour"): Date {
  switch (unit) {
    case "hour":
      return addHours(date, amount);
    case "day":
      return addDays(date, amount);
    case "week":
      return addWeeks(date, amount);
    case "month":
      return addMonths(date, amount);
    case "year":
      return addYears(date, amount);
  }
}

/**
 * Get the start of a given time unit.
 */
export function startOf(date: Date, unit: DateUnit): Date {
  switch (unit) {
    case "day":
      return startOfDay(date);
    case "week":
      return startOfWeek(date, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(date);
    case "year":
      return startOfYear(date);
  }
}

/**
 * Get the duration between two dates in the given unit.
 */
function duration(from: Date, to: Date, unit: DateUnit | "hour"): number {
  switch (unit) {
    case "hour":
      return differenceInHours(to, from);
    case "day":
      return differenceInDays(to, from);
    case "month":
      return differenceInMonths(to, from);
    case "year":
      return differenceInYears(to, from);
    case "week":
      return Math.floor(differenceInDays(to, from) / 7);
  }
}

/**
 * Check if two dates are the same in the given unit.
 */
function isSameUnit(a: Date, b: Date, unit: DateUnit | "hour"): boolean {
  switch (unit) {
    case "hour":
      return isSameHour(a, b);
    case "day":
      return isSameDay(a, b);
    case "month":
      return isSameMonth(a, b);
    case "year":
      return isSameYear(a, b);
    case "week":
      return isSameDay(
        startOfWeek(a, { weekStartsOn: 1 }),
        startOfWeek(b, { weekStartsOn: 1 }),
      );
  }
}

/**
 * Format a date based on the time unit used for graph ticks.
 */
function formatTickDate(date: Date, unit: DateUnit | "hour"): string {
  switch (unit) {
    case "hour":
      return format(date, "HH:mm");
    case "day":
      return format(date, "EEE");
    case "month":
      return format(date, "MMM");
    case "year":
      return format(date, "yyyy");
    case "week":
      return format(date, "EEE");
  }
}

/**
 * Calculate tick values from insights graph data.
 * Ported from mobile app: usePresenter.ts
 */
export function calculateTickValues(
  insights: InsightsResponse | undefined,
  selectedTimeGranularity: TimeGranularity,
): {
  tickValues: Tick[];
  largestTotal: number;
  largestTotalHeatPower: number;
} {
  if (!insights?.graph) {
    return { tickValues: [], largestTotal: 0, largestTotalHeatPower: 0 };
  }

  const { graph, from, to } = insights;
  const timeUnit = INSIGHTS_TIME_UNITS[selectedTimeGranularity];

  const fromDate = new Date(from);
  const toDate = new Date(to);

  // Calculate the max totals across all graph entries
  const totals = graph.reduce(
    (acc, x) => {
      if (!x) return acc;
      const hpElectric = Math.max(0, positiveOrZero(x.hpElectric));
      const hpHeat = Math.max(0, positiveOrZero(x.hpHeat));
      const boilerHeat = Math.max(0, positiveOrZero(x.boilerHeat));

      return {
        largestTotal: Math.max(
          acc.largestTotal,
          hpElectric + hpHeat + boilerHeat,
        ),
        largestTotalHeatPower: Math.max(
          acc.largestTotalHeatPower,
          hpHeat + boilerHeat,
        ),
      };
    },
    { largestTotal: 0, largestTotalHeatPower: 0 },
  );

  const numTicks = duration(fromDate, toDate, timeUnit) + 1;

  const tickValues: Tick[] = Array.from({ length: numTicks }).map(
    (_, index) => {
      const date = addUnits(fromDate, index, timeUnit);
      const data = graph.find(
        (x) => x && isSameUnit(new Date(x.timestamp), date, timeUnit),
      );

      const hpHeat = positiveOrZero(data?.hpHeat);
      const hpElectric = positiveOrZero(data?.hpElectric);
      // Normalize HP heat by subtracting electricity to prevent double-counting
      const normalizedHpHeat = Math.max(hpHeat - hpElectric, 0);
      const spacer =
        isPositive(data?.hpHeat) && isPositive(data?.boilerHeat)
          ? Math.round(totals.largestTotal * TICK_SPACER_RATIO)
          : 0;

      return {
        x: formatTickDate(date, timeUnit),
        hpElectric,
        hpHeat: normalizedHpHeat,
        hpHeatOriginal: hpHeat,
        spacer,
        boilerHeat:
          data?.boilerHeat != null ? positiveOrZero(data.boilerHeat) : null,
        total: totals.largestTotal,
        cop: data?.cop,
      };
    },
  );

  return {
    tickValues,
    largestTotal: totals.largestTotal,
    largestTotalHeatPower: totals.largestTotalHeatPower,
  };
}

/**
 * Calculate the HP heat percentage vs total heat.
 */
export function calculateHpPercentage(
  totalHpHeat?: number,
  totalBoilerHeat?: number,
): number | null {
  const hp = totalHpHeat ?? 0;
  const boiler = totalBoilerHeat ?? 0;
  const total = hp + boiler;
  if (total === 0) return null;
  return Math.round((hp / total) * 100);
}

/**
 * Check if two dates are the same for a given date unit.
 * Used for navigation button disable logic.
 */
export function isSameDateUnit(
  a: Date,
  b: Date,
  unit: DateUnit | undefined,
): boolean {
  if (!unit) return true;
  return isSameUnit(a, b, unit);
}

/**
 * Navigate to the previous date period.
 */
export function getPreviousDate(
  currentDate: Date,
  unit: DateUnit,
  minimumDate: Date,
): Date {
  const newDate = startOf(addUnits(currentDate, -1, unit), unit);
  if (isBefore(newDate, minimumDate)) {
    return minimumDate;
  }
  return newDate;
}

/**
 * Navigate to the next date period.
 */
export function getNextDate(currentDate: Date, unit: DateUnit): Date {
  return startOf(addUnits(currentDate, 1, unit), unit);
}

/**
 * Calculate the `from` date for the API query based on selected date and granularity.
 */
export function calculateFromDate(
  selectedDate: Date,
  unit: DateUnit | undefined,
  minimumDate: Date,
): Date {
  if (!unit) {
    // "all" timeframe - use the start of the minimum date's year
    return startOfYear(minimumDate);
  }
  const newDate = startOf(selectedDate, unit);
  const minStart = startOf(minimumDate, unit);
  return isBefore(newDate, minStart) ? minStart : newDate;
}
