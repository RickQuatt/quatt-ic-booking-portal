import { components } from "../openapi-client/types/api/v1";
import HybridIcon from "@/assets/installationTypes/Hybrid.svg?react";
import AllElectricIcon from "@/assets/installationTypes/All-E.svg?react";
import ChillIcon from "@/assets/installationTypes/Chill.svg?react";
import HomeBatteryIcon from "@/assets/installationTypes/HomeBattery.svg?react";
import { DetailedInstallationType } from "@/constants/enums";

type InstallationTypeValue = components["schemas"]["DetailedInstallationType"];

/**
 * Maps installation types to their corresponding emoji representations
 * @param type - The installation type to map
 * @returns The emoji string representing the installation type
 */
export function getInstallationTypeEmoji(
  type: InstallationTypeValue | undefined,
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

type SvgComponent = React.FC<React.SVGProps<SVGSVGElement>>;

export interface InstallationTypeIcons {
  /** Whether to show fire icon (system uses gas) - Hybrid only */
  showFire: boolean;
  /** System type icon - AllElectricIcon for All-E, HomeBatteryIcon for HOME_BATTERY, null for Hybrid */
  systemIcon: SvgComponent | null;
  /** The Chill icon if this is a chill variant, null otherwise */
  chillIcon: SvgComponent | null;
  /** Number of HybridIcons (heat pumps) to display */
  heatPumpCount: 0 | 1 | 2;
  /** The heat pump icon component (HybridIcon) - null for HOME_BATTERY */
  heatPumpIcon: SvgComponent | null;
}

/**
 * Maps installation types to their corresponding SVG icon components
 * Returns an object with showFire, systemIcon, chillIcon, heatPumpCount, and heatPumpIcon
 *
 * Icon rendering order: Chill → Fire/SystemIcon → HeatPumpIcons
 *
 * @param type - The installation type to map
 * @returns Object containing icons and heat pump count, or null if unknown type
 *
 * @example
 * ```tsx
 * const icons = getInstallationTypeIcons(installation.type);
 * if (icons) {
 *   const { showFire, systemIcon: SystemIcon, chillIcon: ChillIcon, heatPumpCount, heatPumpIcon: HeatPumpIcon } = icons;
 *   return (
 *     <div className="flex items-center gap-1">
 *       {ChillIcon && <ChillIcon className="h-5 w-5" />}
 *       {showFire && <Flame className="h-4 w-4 text-orange-500" />}
 *       {SystemIcon && <SystemIcon className="h-5 w-5" />}
 *       {HeatPumpIcon && Array.from({ length: heatPumpCount }).map((_, i) => (
 *         <HeatPumpIcon key={i} className="h-5 w-5" />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function getInstallationTypeIcons(
  type: InstallationTypeValue | undefined,
): InstallationTypeIcons | null {
  if (!type) {
    return null;
  }

  switch (type) {
    case "HYBRID_SINGLE":
      return {
        showFire: true,
        systemIcon: null,
        chillIcon: null,
        heatPumpCount: 1,
        heatPumpIcon: HybridIcon,
      };
    case "HYBRID_DUO":
      return {
        showFire: true,
        systemIcon: null,
        chillIcon: null,
        heatPumpCount: 2,
        heatPumpIcon: HybridIcon,
      };
    case "ALL_ELECTRIC_SINGLE":
      return {
        showFire: false,
        systemIcon: AllElectricIcon,
        chillIcon: null,
        heatPumpCount: 1,
        heatPumpIcon: HybridIcon,
      };
    case "ALL_ELECTRIC_DUO":
      return {
        showFire: false,
        systemIcon: AllElectricIcon,
        chillIcon: null,
        heatPumpCount: 2,
        heatPumpIcon: HybridIcon,
      };
    case "CHILL_HYBRID_SINGLE":
      return {
        showFire: true,
        systemIcon: null,
        chillIcon: ChillIcon,
        heatPumpCount: 1,
        heatPumpIcon: HybridIcon,
      };
    case "CHILL_HYBRID_DUO":
      return {
        showFire: true,
        systemIcon: null,
        chillIcon: ChillIcon,
        heatPumpCount: 2,
        heatPumpIcon: HybridIcon,
      };
    case "CHILL_ALL_ELECTRIC_SINGLE":
      return {
        showFire: false,
        systemIcon: AllElectricIcon,
        chillIcon: ChillIcon,
        heatPumpCount: 1,
        heatPumpIcon: HybridIcon,
      };
    case "CHILL_ALL_ELECTRIC_DUO":
      return {
        showFire: false,
        systemIcon: AllElectricIcon,
        chillIcon: ChillIcon,
        heatPumpCount: 2,
        heatPumpIcon: HybridIcon,
      };
    case "HOME_BATTERY":
      return {
        showFire: false,
        systemIcon: HomeBatteryIcon,
        chillIcon: null,
        heatPumpCount: 0,
        heatPumpIcon: null,
      };
    default:
      return null;
  }
}

/**
 * Maps installation types to human-readable labels
 * @param type - The installation type to map
 * @returns The human-readable label for the installation type
 */
export function getInstallationTypeLabel(
  type: InstallationTypeValue | undefined | "null",
): string {
  if (!type || type === "null") {
    return "";
  }
  return DetailedInstallationType.getLabel(type);
}
