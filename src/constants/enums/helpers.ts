// === HELPER TYPE & FACTORY ===
export interface EnumMeta {
  label: string;
  emoji?: string;
}

export interface EnumMetaResult<T extends string> {
  meta: Record<T, EnumMeta>;
  values: T[];
  getLabel: (value: T) => string;
  getEmoji: (value: T) => string | undefined;
}

/**
 * Creates a type-safe enum metadata object with values array and label getter.
 *
 * Using Record<T, EnumMeta> ensures:
 * - All enum values must be present (compile error if missing)
 * - No duplicates possible (object keys are unique)
 * - Labels are colocated with values
 *
 * @example
 * ```typescript
 * type Status = "ACTIVE" | "INACTIVE";
 * export const Status = createEnumMeta<Status>({
 *   ACTIVE: { label: "Active" },
 *   INACTIVE: { label: "Inactive" },
 * });
 *
 * // Usage:
 * Status.values // ["ACTIVE", "INACTIVE"]
 * Status.getLabel("ACTIVE") // "Active"
 * Status.getEmoji("ACTIVE") // undefined (or emoji if defined)
 * ```
 */
export function createEnumMeta<T extends string>(
  meta: Record<T, EnumMeta>,
): EnumMetaResult<T> {
  return {
    meta,
    values: Object.keys(meta) as T[],
    getLabel: (value: T) => meta[value].label,
    getEmoji: (value: T) => meta[value].emoji,
  };
}
