import { useListPageState } from "@/hooks/useListPageState";
import { stringField, isoStringField } from "@/utils/urlStateUtils";
import type { CICFilters } from "../components/CICFilters";

/**
 * Hook for managing CIC list page state with URL synchronization.
 *
 * Provides:
 * - Type-safe filter state synced to URL
 * - Pagination synced to URL
 * - Automatic page reset when filters change
 * - Navigation helpers
 *
 * @example
 * ```tsx
 * const { filters, pagination, setFilters, goToPage } = useCICListState();
 * ```
 */
export function useCICListState() {
  return useListPageState<CICFilters>({
    filterConfig: {
      id: stringField(),
      orderNumber: stringField(),
      minCreatedAt: isoStringField(),
      maxCreatedAt: isoStringField(),
    },
    defaultPageSize: 20,
  });
}
