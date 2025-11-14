import { components } from "../openapi-client/types/api/v1";
/**
 * Maps installation types to their corresponding emoji representations
 * @param type - The installation type to map
 * @returns The emoji string representing the installation type
 */

type InstallationType = components["schemas"]["DetailedInstallationType"];
export function getInstallationTypeEmoji(
  type: InstallationType | undefined,
): string {
  if (!type) {
    return "❓";
  }

  switch (type) {
    case "HYBRID_SINGLE":
      return "🔥⚡";
    case "HYBRID_DUO":
      return "🔥⚡⚡";
    case "ALL_ELECTRIC_SINGLE":
      return "🔋⚡";
    case "ALL_ELECTRIC_DUO":
      return "🔋⚡⚡";
    case "CHILL_HYBRID_SINGLE":
      return "❄️🔥⚡";
    case "CHILL_HYBRID_DUO":
      return "❄️🔥⚡⚡";
    case "CHILL_ALL_ELECTRIC_SINGLE":
      return "❄️🔋⚡";
    case "CHILL_ALL_ELECTRIC_DUO":
      return "❄️🔋⚡⚡";
    case "HOME_BATTERY":
      return "🏠🔋";
  }
}

/**
 * Maps installation types to human-readable labels
 * @param type - The installation type to map
 * @returns The human-readable label for the installation type
 */
export function getInstallationTypeLabel(
  type: InstallationType | undefined | "null",
): string {
  if (!type || type === "null") {
    return "";
  }

  switch (type) {
    case "HYBRID_SINGLE":
      return "Hybrid Single";
    case "HYBRID_DUO":
      return "Hybrid Duo";
    case "ALL_ELECTRIC_SINGLE":
      return "All Electric Single";
    case "ALL_ELECTRIC_DUO":
      return "All Electric Duo";
    case "CHILL_HYBRID_SINGLE":
      return "Chill Hybrid Single";
    case "CHILL_HYBRID_DUO":
      return "Chill Hybrid Duo";
    case "CHILL_ALL_ELECTRIC_SINGLE":
      return "Chill All Electric Single";
    case "CHILL_ALL_ELECTRIC_DUO":
      return "Chill All Electric Duo";
    case "HOME_BATTERY":
      return "Home Battery";
    default:
      return "Unknown";
  }
}
