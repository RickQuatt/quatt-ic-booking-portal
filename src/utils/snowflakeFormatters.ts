/**
 * Proper type for Snowflake value field (more specific than auto-generated 'object')
 */
export type SnowflakeValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | null;

/**
 * Convert UPPERCASE_SNAKE_CASE to "Readable Label"
 * Example: "OUTSIDE_TEMPERATURE" -> "Outside temperature"
 */
export function formatKeyLabel(key: string): string {
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Check if a string is a valid date
 */
function isValidDateString(value: string): boolean {
  // Only attempt parsing for reasonable length strings
  if (value.length < 8 || value.length > 30) {
    return false;
  }

  const timestamp = Date.parse(value);
  return !isNaN(timestamp) && timestamp > 0;
}

/**
 * Format value for display based on its type
 */
export function formatValue(value: SnowflakeValue): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === "string" && isValidDateString(value)) {
    return new Date(value).toLocaleString();
  }

  return String(value);
}

/**
 * Check if a value represents a connection status
 */
export function isConnectionValue(key: string): boolean {
  const connectionKeys = [
    "WIFI",
    "ETHERNET",
    "INTERNET",
    "CONNECTED",
    "CONNECTION",
    "HEAT_PUMP",
    "THERMOSTAT",
    "BOILER",
  ];
  return connectionKeys.some((ck) => key.toUpperCase().includes(ck));
}

/**
 * Type guard to check if a field is a CIC ID field with valid value
 */
export function isCicIdField(
  key: string,
  value: SnowflakeValue,
): value is string {
  return (
    key === "ACTIVE_CIC" &&
    typeof value === "string" &&
    value.startsWith("CIC-")
  );
}

/**
 * Type guard to check if value is an object (not null, not array)
 */
export function isObjectValue(
  value: SnowflakeValue,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Get color for connection status values
 */
export function getConnectionColor(
  value: SnowflakeValue,
): "green" | "red" | undefined {
  if (typeof value === "boolean") {
    return value ? "green" : "red";
  }

  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();
    if (lowerValue === "connected" || lowerValue === "true") {
      return "green";
    }
    if (lowerValue === "disconnected" || lowerValue === "false") {
      return "red";
    }
  }

  return undefined;
}
