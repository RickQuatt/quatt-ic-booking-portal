import { invert } from "lodash-es";
import type { components } from "@/openapi-client/types/api/v1";
import { getEntries } from "./utils/object";

type CicHealthCheckCategory = components["schemas"]["CicHealthCheckCategory"];
type CicHealthChecksByCategory =
  components["schemas"]["CicHealthChecksByCategory"];
type CicHealthChecksByKpi = components["schemas"]["CicHealthChecksByKpi"];

export const kpiToLabel = {
  validSettings: "Cloud settings",
  isConnectedAWS: "Is online",
  isConnectedInternet: "Internet connectivity",
  hasLatestSoftware: "Has latest software version",
  isCommissioned: "Is commissioned",
  cloudConsistency: "Cloud settings consistency",
  runningController: "Correct controller running",
  thermostatConnected: "Thermostat connected",
  roomTemperatureControl: "Room temperature control",
  openthermBoilerConnected: "Opentherm boiler connected",
  heatpumpsConnected: "Heatpumps connected",
  cpuTemperature: "CPU temperature",
  loadAverage: "Load average",
  watchdog: "Watchdog",
  minimumCop: "Tariff COP optimization",
  supervisoryControlMode: "Controller in normal operation",
  heatpumpErrors: "Error flag from heatpump",
  numberOfRestarts: "Number of restarts",
} satisfies { [p in keyof CicHealthChecksByKpi]: string };

export const labelToKpi = invert(kpiToLabel);

export const categoryToLabel = {
  cic_software: "CIC software",
  connectivity: "Connectivity",
  controller: "Controller",
  heatpump: "Heatpump",
  io_connectivity: "IO Connectivity",
  settings: "Settings",
  updates: "Updates",
} satisfies { [p in keyof CicHealthChecksByCategory]: string };

export const labelToCategory = invert(categoryToLabel);

export const kpiToCategory = {
  validSettings: "settings",
  isConnectedAWS: "connectivity",
  isConnectedInternet: "connectivity",
  hasLatestSoftware: "updates",
  isCommissioned: "settings",
  cloudConsistency: "settings",
  runningController: "settings",
  thermostatConnected: "io_connectivity",
  roomTemperatureControl: "io_connectivity",
  openthermBoilerConnected: "io_connectivity",
  heatpumpsConnected: "io_connectivity",
  cpuTemperature: "cic_software",
  loadAverage: "cic_software",
  watchdog: "controller",
  minimumCop: "controller",
  supervisoryControlMode: "controller",
  heatpumpErrors: "heatpump",
  numberOfRestarts: "cic_software",
} satisfies { [p in keyof CicHealthChecksByKpi]: CicHealthCheckCategory };

const categoryToKpis = getEntries(kpiToCategory).reduce(
  (acc, [kpi, category]) => {
    if (!acc[category]) {
      acc[category] = [kpi];
      return acc;
    }

    acc[category].push(kpi);
    return acc;
  },
  {} as { [p in CicHealthCheckCategory]: (keyof CicHealthChecksByKpi)[] },
);

export function categoryToKpiLabels(category: CicHealthCheckCategory) {
  return categoryToKpis[category].map((kpi) => kpiToLabel[kpi]).join(", ");
}
