import type { components } from "@/openapi-client/types/api/v1";
import { createEnumMeta } from "./helpers";

export const DeviceType = createEnumMeta<components["schemas"]["DeviceType"]>({
  OUTDOOR_UNIT: { label: "Outdoor Unit" },
  HEAT_CHARGER: { label: "Heat Charger" },
  HEAT_BATTERY: { label: "Heat Battery" },
  DONGLE: { label: "Dongle" },
  BOILER: { label: "Boiler" },
  CHILL: { label: "Chill" },
  THERMOSTAT: { label: "Thermostat" },
  FLOW_TEMPERATURE_SENSOR: { label: "Flow Temperature Sensor" },
  HOME_BATTERY: { label: "Home Battery" },
});

export const DeviceStatus = createEnumMeta<
  components["schemas"]["DeviceStatus"]
>({
  FACTORY: { label: "Factory" },
  UNINSTALLED: { label: "Uninstalled" },
  PENDING_COMMISSIONING: { label: "Pending Commissioning" },
  ACTIVE: { label: "Active" },
  IN_ERROR: { label: "In Error" },
});

export const DongleRole = createEnumMeta<components["schemas"]["DongleRole"]>({
  EXTENDER: { label: "Extender" },
  RCP: { label: "RCP" },
});

export const HeatBatterySize = createEnumMeta<
  components["schemas"]["HeatBatterySize"]
>({
  medium: { label: "Medium" },
  large: { label: "Large" },
  extra_large: { label: "Extra Large" },
});
