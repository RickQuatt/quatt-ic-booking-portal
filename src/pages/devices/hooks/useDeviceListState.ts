import { useListPageState } from "@/hooks/useListPageState";
import { stringField, dateField, enumField } from "@/utils/urlStateUtils";
import type { DeviceFilters } from "../components/DeviceFilters";
import {
  DeviceType,
  DeviceStatus,
  DongleRole,
  HeatBatterySize,
} from "@/constants/enums";

/**
 * Hook for managing Device list page state with URL synchronization.
 *
 * Provides:
 * - Type-safe filter state synced to URL
 * - Pagination synced to URL
 * - Automatic page reset when filters change
 * - Navigation helpers
 *
 * @example
 * ```tsx
 * const { filters, pagination, setFilters, goToPage } = useDeviceListState();
 * ```
 */
export function useDeviceListState() {
  return useListPageState<DeviceFilters>({
    filterConfig: {
      type: enumField(DeviceType),
      deviceUuid: stringField(),
      installationUuid: stringField(),
      cicId: stringField(),
      serialNumber: stringField(),
      name: stringField(),
      status: enumField(DeviceStatus),
      eui64: stringField(),
      minCreatedAt: dateField(),
      maxCreatedAt: dateField(),
      minUpdatedAt: dateField(),
      maxUpdatedAt: dateField(),
      // Conditional filters
      role: enumField(DongleRole),
      pcbHwVersion: stringField(),
      heatBatterySize: enumField(HeatBatterySize),
    },
    defaultPageSize: 20,
  });
}
