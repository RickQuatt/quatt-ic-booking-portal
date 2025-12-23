import { useCallback, useRef, useMemo } from "react";
import { useUrlState, type StateConfig, type FieldConfig } from "./useUrlState";
import { numberField } from "@/utils/urlStateUtils";

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface UseListPageStateOptions<TFilters extends object> {
  /** Configuration for filter fields */
  filterConfig: StateConfig<TFilters>;
  /** Default page size (default: 20) */
  defaultPageSize?: number;
  /** Whether to reset page to 1 when filters change (default: true) */
  resetPageOnFilterChange?: boolean;
}

export interface UseListPageStateReturn<TFilters> {
  /** Current filter state */
  filters: TFilters;
  /** Current pagination state */
  pagination: PaginationState;
  /** Update filters (automatically resets page if enabled) */
  setFilters: (filters: TFilters) => void;
  /** Update pagination */
  setPagination: (pagination: Partial<PaginationState>) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Clear all filters and reset pagination */
  clearAll: () => void;
  /** Check if any filters are active */
  hasActiveFilters: boolean;
}

type CombinedState<TFilters> = TFilters & PaginationState;

/**
 * High-level hook for managing list page state (filters + pagination) with URL sync.
 *
 * Features:
 * - Syncs filters and pagination to URL query parameters
 * - Automatically resets page to 1 when filters change
 * - Provides navigation helpers for pagination
 * - Tracks whether any filters are active
 *
 * @example
 * ```tsx
 * const {
 *   filters,
 *   pagination,
 *   setFilters,
 *   goToPage,
 *   nextPage,
 *   previousPage,
 * } = useListPageState<DeviceFilters>({
 *   filterConfig: {
 *     type: enumField(DEVICE_TYPES),
 *     name: stringField(),
 *   },
 *   defaultPageSize: 20,
 * });
 * ```
 */
export function useListPageState<TFilters extends object>(
  options: UseListPageStateOptions<TFilters>,
): UseListPageStateReturn<TFilters> {
  const {
    filterConfig,
    defaultPageSize = 20,
    resetPageOnFilterChange = true,
  } = options;

  // Combine filter config with pagination config
  const fullConfig = useMemo(
    () =>
      ({
        ...filterConfig,
        page: numberField(1),
        pageSize: numberField(defaultPageSize),
      }) as StateConfig<CombinedState<TFilters>>,
    [filterConfig, defaultPageSize],
  );

  const [state, setState, clearState] = useUrlState<CombinedState<TFilters>>({
    config: fullConfig,
  });

  // Track previous filters for page reset comparison
  const prevFiltersRef = useRef<string>("");

  // Extract filters from combined state
  const filters = useMemo(() => {
    const result = {} as TFilters;
    for (const key of Object.keys(filterConfig) as Array<keyof TFilters>) {
      result[key] = state[
        key as keyof CombinedState<TFilters>
      ] as TFilters[keyof TFilters];
    }
    return result;
  }, [state, filterConfig]);

  // Extract pagination from combined state
  const pagination: PaginationState = useMemo(
    () => ({
      page: state.page ?? 1,
      pageSize: state.pageSize ?? defaultPageSize,
    }),
    [state.page, state.pageSize, defaultPageSize],
  );

  // Set filters with automatic page reset
  const setFilters = useCallback(
    (newFilters: TFilters) => {
      const updates: Partial<CombinedState<TFilters>> = {
        ...newFilters,
      } as Partial<CombinedState<TFilters>>;

      if (resetPageOnFilterChange) {
        // Compare filters to determine if we need to reset page
        const newFilterStr = JSON.stringify(newFilters);
        if (prevFiltersRef.current !== newFilterStr) {
          prevFiltersRef.current = newFilterStr;
          (updates as Partial<PaginationState>).page = 1;
        }
      }

      setState(updates);
    },
    [setState, resetPageOnFilterChange],
  );

  // Set pagination
  const setPagination = useCallback(
    (paginationUpdate: Partial<PaginationState>) => {
      setState(paginationUpdate as Partial<CombinedState<TFilters>>);
    },
    [setState],
  );

  // Navigation helpers
  const nextPage = useCallback(() => {
    setState({ page: pagination.page + 1 } as Partial<CombinedState<TFilters>>);
  }, [setState, pagination.page]);

  const previousPage = useCallback(() => {
    setState({
      page: Math.max(1, pagination.page - 1),
    } as Partial<CombinedState<TFilters>>);
  }, [setState, pagination.page]);

  const goToPage = useCallback(
    (page: number) => {
      setState({ page: Math.max(1, page) } as Partial<CombinedState<TFilters>>);
    },
    [setState],
  );

  // Check for active filters
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([, v]) => {
      return v !== undefined && v !== "" && v !== "all";
    });
  }, [filters]);

  return {
    filters,
    pagination,
    setFilters,
    setPagination,
    nextPage,
    previousPage,
    goToPage,
    clearAll: clearState,
    hasActiveFilters,
  };
}
