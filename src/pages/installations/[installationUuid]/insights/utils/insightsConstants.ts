import type { TimeGranularity, DateUnit } from "../types/insights.types";

/**
 * Maps time granularity to the unit used for date navigation (prev/next).
 */
export const UNITS_FOR_TIME_GRANULARITY: Record<
  TimeGranularity,
  DateUnit | undefined
> = {
  day: "day",
  week: "week",
  month: "month",
  year: "year",
  all: undefined,
};

/**
 * Maps time granularity to the unit used for graph data aggregation.
 * E.g., "day" view shows hourly data, "week" view shows daily data.
 */
export const INSIGHTS_TIME_UNITS: Record<TimeGranularity, DateUnit | "hour"> = {
  day: "hour",
  week: "day",
  month: "day",
  year: "month",
  all: "year",
};

/** Ratio of spacer bar between HP and boiler segments */
export const TICK_SPACER_RATIO = 0.02;

/** Chart colors matching the mobile app */
export const CHART_COLORS = {
  hpElectric: "rgba(173, 216, 230, 0.8)",
  hpElectricBorder: "rgba(173, 216, 230, 1)",
  hpHeat: "rgba(0, 206, 209, 0.8)",
  hpHeatBorder: "rgba(0, 206, 209, 1)",
  boiler: "rgba(255, 105, 51, 0.8)",
  boilerBorder: "rgba(255, 105, 51, 1)",
  tempCold: "#0088CC",
  tempMild: "#00CC88",
  tempWarm: "#FFDD00",
  roomTemp: "rgba(0, 206, 209, 0.8)",
  roomSetpoint: "rgba(150, 150, 150, 0.6)",
  waterTemp: "rgba(255, 140, 66, 0.8)",
} as const;
