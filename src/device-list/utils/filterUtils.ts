// Utility functions for filter processing

/**
 * Validates that a filter value meets minimum character requirements
 * Returns undefined if it doesn't meet the requirement
 */
export function validateMinLength(
  value: string | undefined,
  minLength: number,
): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();

  if (trimmed.length < minLength) return undefined;

  return trimmed;
}
