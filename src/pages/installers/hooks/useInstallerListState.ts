import { useListPageState } from "@/hooks/useListPageState";
import {
  stringField,
  dateField,
  booleanOrAllField,
} from "@/utils/urlStateUtils";
import type { InstallerFilters } from "../components/InstallerFilters";

/**
 * Hook for managing Installer list page state with URL synchronization.
 *
 * Note: The Installers page uses client-side filtering, but we still
 * sync the filters to URL for shareable links and browser navigation.
 *
 * Provides:
 * - Type-safe filter state synced to URL
 * - Pagination synced to URL
 * - Automatic page reset when filters change
 * - Navigation helpers
 *
 * @example
 * ```tsx
 * const { filters, pagination, setFilters, goToPage } = useInstallerListState();
 * ```
 */
export function useInstallerListState() {
  return useListPageState<InstallerFilters>({
    filterConfig: {
      code: stringField(),
      name: stringField(),
      phone: stringField(),
      isActive: booleanOrAllField(),
      minCreatedAt: dateField(),
      maxCreatedAt: dateField(),
    },
    defaultPageSize: 20,
  });
}
