import { useListPageState } from "@/hooks/useListPageState";
import {
  stringField,
  dateField,
  nullableEnumField,
} from "@/utils/urlStateUtils";
import type { InstallationFilters } from "../components/InstallationFilters";
import { DetailedInstallationType } from "@/constants/enums";

/**
 * Hook for managing Installation list page state with URL synchronization.
 *
 * Provides:
 * - Type-safe filter state synced to URL
 * - Pagination synced to URL
 * - Automatic page reset when filters change
 * - Navigation helpers
 *
 * @example
 * ```tsx
 * const { filters, pagination, setFilters, goToPage } = useInstallationListState();
 * ```
 */
export function useInstallationListState() {
  return useListPageState<InstallationFilters>({
    filterConfig: {
      installationUuid: stringField(),
      orderNumber: stringField(),
      cicId: stringField(),
      installationType: nullableEnumField(DetailedInstallationType),
      zipCode: stringField(),
      houseNumber: stringField(),
      houseAddition: stringField(),
      houseId: stringField(),
      minCreatedAt: dateField(),
      maxCreatedAt: dateField(),
      minUpdatedAt: dateField(),
      maxUpdatedAt: dateField(),
    },
    defaultPageSize: 20,
  });
}
