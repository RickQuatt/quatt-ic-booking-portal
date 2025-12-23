import { useCallback, useMemo } from "react";
import { useSearch, useLocation } from "wouter";

/**
 * Configuration for how to serialize/deserialize a single field to/from URL
 */
export interface FieldConfig<T> {
  /** Convert URL string value to state value */
  parse: (value: string | null) => T | undefined;
  /** Convert state value to URL string (return undefined to omit from URL) */
  serialize: (value: T | undefined) => string | undefined;
  /** Default value when not present in URL */
  defaultValue?: T;
}

/**
 * Configuration object mapping field names to their serialization config
 */
export type StateConfig<T> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

export interface UseUrlStateOptions<T> {
  /** Field configurations for serialization/deserialization */
  config: StateConfig<T>;
  /** Whether to replace or push history entries (default: true = replace) */
  replaceState?: boolean;
}

/**
 * Generic hook that synchronizes typed state with URL query parameters.
 *
 * @example
 * ```tsx
 * const [state, setState, clearState] = useUrlState({
 *   config: {
 *     name: stringField(),
 *     page: numberField(1),
 *   },
 * });
 * ```
 *
 * @returns [state, setState, clearState] tuple
 */
export function useUrlState<T extends object>(
  options: UseUrlStateOptions<T>,
): [T, (updates: Partial<T>) => void, () => void] {
  const searchString = useSearch();
  const [location, setLocation] = useLocation();
  const { config, replaceState = true } = options;

  // Parse current URL into state
  const state = useMemo(() => {
    const params = new URLSearchParams(searchString);
    const result = {} as T;

    for (const key of Object.keys(config) as Array<keyof T>) {
      const fieldConfig = config[key];
      const urlValue = params.get(key as string);
      const parsed = fieldConfig.parse(urlValue);
      result[key] = (
        parsed !== undefined ? parsed : fieldConfig.defaultValue
      ) as T[keyof T];
    }

    return result;
  }, [searchString, config]);

  // Update URL with new state values
  const setState = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchString);

      for (const [key, value] of Object.entries(updates)) {
        const fieldConfig = config[key as keyof T];
        if (!fieldConfig) continue;

        const serialized = fieldConfig.serialize(value as T[keyof T]);
        if (serialized !== undefined && serialized !== "") {
          params.set(key, serialized);
        } else {
          params.delete(key);
        }
      }

      const newSearch = params.toString();
      const basePath = location.split("?")[0];
      const newUrl = newSearch ? `${basePath}?${newSearch}` : basePath;

      setLocation(newUrl, { replace: replaceState });
    },
    [searchString, location, setLocation, config, replaceState],
  );

  // Clear all URL state
  const clearState = useCallback(() => {
    const basePath = location.split("?")[0];
    setLocation(basePath, { replace: replaceState });
  }, [location, setLocation, replaceState]);

  return [state, setState, clearState];
}
