import type { FieldConfig } from "@/hooks/useUrlState";
import type { EnumMetaResult } from "@/constants/enums";

/**
 * Field parser for optional string values.
 * Empty strings are omitted from URL.
 */
export function stringField(
  defaultValue?: string,
): FieldConfig<string | undefined> {
  return {
    parse: (v) => v || undefined,
    serialize: (v) => v || undefined,
    defaultValue,
  };
}

/**
 * Field parser for number values (e.g., page, pageSize).
 * Defaults to provided value when not in URL.
 * Omits from URL when value equals default.
 */
export function numberField(defaultValue: number): FieldConfig<number> {
  return {
    parse: (v) => {
      if (v === null) return defaultValue;
      const parsed = parseInt(v, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    },
    serialize: (v) =>
      v !== undefined && v !== defaultValue ? String(v) : undefined,
    defaultValue,
  };
}

/**
 * Field parser for Date objects.
 * Stored as ISO strings in URL, parsed back to Date objects.
 */
export function dateField(): FieldConfig<Date | undefined> {
  return {
    parse: (v) => {
      if (!v) return undefined;
      const date = new Date(v);
      return isNaN(date.getTime()) ? undefined : date;
    },
    serialize: (v) => v?.toISOString(),
  };
}

/**
 * Field parser for ISO string date fields (like CICFilters uses).
 * Stored and returned as strings, not Date objects.
 */
export function isoStringField(): FieldConfig<string | undefined> {
  return {
    parse: (v) => v || undefined,
    serialize: (v) => v || undefined,
  };
}

/**
 * Field parser for boolean values.
 */
export function booleanField(
  defaultValue?: boolean,
): FieldConfig<boolean | undefined> {
  return {
    parse: (v) => {
      if (v === null) return undefined;
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    },
    serialize: (v) => (v !== undefined ? String(v) : undefined),
    defaultValue,
  };
}

/**
 * Field parser for boolean with "all" option (like InstallerFilters.isActive).
 * "all" is treated as the default and omitted from URL.
 */
export function booleanOrAllField(): FieldConfig<boolean | "all" | undefined> {
  return {
    parse: (v) => {
      if (v === null || v === "all") return "all";
      if (v === "true") return true;
      if (v === "false") return false;
      return "all";
    },
    serialize: (v) => {
      if (v === undefined || v === "all") return undefined;
      return String(v);
    },
    defaultValue: "all",
  };
}

/**
 * Field parser for type-safe enum values.
 * Invalid values are parsed as undefined.
 *
 * Accepts either an EnumMetaResult object (preferred) or a readonly array of values.
 * When passing EnumMetaResult, the type is automatically inferred.
 *
 * @example
 * ```typescript
 * // Preferred - type inferred from EnumMetaResult
 * type: enumField(DeviceTypes),
 *
 * // Also supported - explicit array
 * type: enumField<DeviceType>(["DONGLE", "HEAT_BATTERY"]),
 * ```
 */
export function enumField<T extends string>(
  enumMeta: EnumMetaResult<T>,
  defaultValue?: T,
): FieldConfig<T | undefined>;
export function enumField<T extends string>(
  validValues: readonly T[],
  defaultValue?: T,
): FieldConfig<T | undefined>;
export function enumField<T extends string>(
  enumMetaOrValues: EnumMetaResult<T> | readonly T[],
  defaultValue?: T,
): FieldConfig<T | undefined> {
  // EnumMetaResult has getLabel, arrays don't
  const validValues: readonly T[] =
    "getLabel" in enumMetaOrValues ? enumMetaOrValues.values : enumMetaOrValues;
  return {
    parse: (v) => {
      if (v === null) return undefined;
      return validValues.includes(v as T) ? (v as T) : undefined;
    },
    serialize: (v) => (v !== undefined && v !== defaultValue ? v : undefined),
    defaultValue,
  };
}

/**
 * Field parser for type-safe enum values that can also be null.
 * Used when the schema type includes `| null`.
 *
 * Accepts either an EnumMetaResult object (preferred) or a readonly array of values.
 * When passing EnumMetaResult, the type is automatically inferred.
 *
 * @example
 * ```typescript
 * // Preferred - type inferred from EnumMetaResult
 * installationType: nullableEnumField(InstallationTypes),
 *
 * // Also supported - explicit array
 * installationType: nullableEnumField<InstallationType>(["HYBRID_SINGLE", ...]),
 * ```
 */
export function nullableEnumField<T extends string>(
  enumMeta: EnumMetaResult<T>,
): FieldConfig<T | null | undefined>;
export function nullableEnumField<T extends string>(
  validValues: readonly T[],
): FieldConfig<T | null | undefined>;
export function nullableEnumField<T extends string>(
  enumMetaOrValues: EnumMetaResult<T> | readonly T[],
): FieldConfig<T | null | undefined> {
  // EnumMetaResult has getLabel, arrays don't
  const validValues: readonly T[] =
    "getLabel" in enumMetaOrValues ? enumMetaOrValues.values : enumMetaOrValues;
  return {
    parse: (v) => {
      if (v === null || v === undefined) return undefined;
      return validValues.includes(v as T) ? (v as T) : undefined;
    },
    serialize: (v) => (v !== undefined && v !== null ? v : undefined),
  };
}

/**
 * Field parser for array values (comma-separated in URL).
 * Example: ?tags=tag1,tag2,tag3
 */
export function arrayField<T extends string>(): FieldConfig<T[] | undefined> {
  return {
    parse: (v) => (v ? (v.split(",") as T[]) : undefined),
    serialize: (v) => (v?.length ? v.join(",") : undefined),
  };
}
