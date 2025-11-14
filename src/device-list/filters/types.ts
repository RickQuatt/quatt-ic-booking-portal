import { components } from "../../openapi-client/types/api/v1";

// Extract the device item type for reference
export type DeviceItem = components["schemas"]["AdminDeviceListItem"];

// Define filter types matching API query parameters
export type DeviceFilters = {
  // Pagination
  page?: number;
  pageSize?: number;

  // Common filters (always available)
  type?: components["schemas"]["DeviceType"];
  deviceUuid?: string;
  installationUuid?: string;
  cicId?: string;
  serialNumber?: string;
  name?: string;
  status?: components["schemas"]["DeviceStatus"];
  eui64?: string;

  // Date range filters
  minCreatedAt?: Date | null;
  maxCreatedAt?: Date | null;
  minUpdatedAt?: Date | null;
  maxUpdatedAt?: Date | null;

  // Conditional filters (require specific type)
  role?: components["schemas"]["DongleRole"]; // Requires type=DONGLE
  pcbHwVersion?: string; // Requires type=DONGLE
  heatBatterySize?: components["schemas"]["HeatBatterySize"]; // Requires type=HEAT_BATTERY
};
