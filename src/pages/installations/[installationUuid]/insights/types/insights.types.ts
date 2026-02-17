import type { components } from "@/openapi-client/types/api/v1";

export type TimeGranularity = "day" | "week" | "month" | "year" | "all";

export type InsightsResponse =
  components["responses"]["Insights"]["content"]["application/json"]["result"];

export type InsightsGraphEntry = NonNullable<
  NonNullable<InsightsResponse["graph"]>[number]
>;

export type OutsideTemperatureEntry = NonNullable<
  NonNullable<InsightsResponse["outsideTemperatureGraph"]>[number]
>;

export type RoomTemperatureEntry = NonNullable<
  NonNullable<InsightsResponse["roomTemperatureGraph"]>[number]
>;

export type WaterTemperatureEntry = NonNullable<
  NonNullable<InsightsResponse["waterTemperatureGraph"]>[number]
>;

export type Tick = {
  x: string;
  hpElectric: number;
  hpHeat: number;
  hpHeatOriginal: number;
  spacer: number;
  boilerHeat: number | null;
  total: number;
  cop?: number | null;
};

export type DateUnit = "day" | "week" | "month" | "year";
