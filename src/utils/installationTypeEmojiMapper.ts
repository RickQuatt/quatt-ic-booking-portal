import { InstallationType } from "../api-client/models/InstallationType";

/**
 * Maps installation types to their corresponding emoji representations
 * @param type - The installation type to map
 * @returns The emoji string representing the installation type
 */
export function getInstallationTypeEmoji(
  type: InstallationType | undefined,
): string {
  if (!type) {
    return "";
  }

  switch (type) {
    case InstallationType.Hybrid:
      return "🔥⚡";
    case InstallationType.HybridDuo:
      return "🔥⚡⚡";
    case InstallationType.AllElectric:
      return "🚿⚡";
    case InstallationType.AllElectricDuo:
      return "🚿⚡⚡";
    case InstallationType.HomeBattery:
      return "🔋";
    case InstallationType.Unknown:
      return "❓";
    default:
      return "";
  }
}

/**
 * Maps installation types to human-readable labels
 * @param type - The installation type to map
 * @returns The human-readable label for the installation type
 */
export function getInstallationTypeLabel(
  type: InstallationType | undefined,
): string {
  if (!type) {
    return "";
  }

  switch (type) {
    case InstallationType.Hybrid:
      return "Hybrid";
    case InstallationType.HybridDuo:
      return "Hybrid Duo";
    case InstallationType.AllElectric:
      return "All Electric";
    case InstallationType.AllElectricDuo:
      return "All Electric Duo";
    case InstallationType.HomeBattery:
      return "Home Battery";
    case InstallationType.Unknown:
      return "Unknown";
    default:
      return "";
  }
}
