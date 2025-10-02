import { useMemo } from "react";
import {
  AdminInstallationDetail,
  Device,
  HomeBatteryDevice,
  HomeBatteryDeviceTypeEnum,
} from "../../api-client/models";

/**
 * Type guard to check if a device is a HomeBatteryDevice
 */
function isHomeBatteryDevice(device: Device): device is HomeBatteryDevice {
  return device.type === HomeBatteryDeviceTypeEnum.HomeBattery;
}

/**
 * Custom hook to extract and memoize home battery device from installation
 * @param installation - The installation details containing devices array
 * @returns Object containing the home battery device and its serial number
 */
export function useHomeBatteryDevice(installation: AdminInstallationDetail) {
  const homeBatteryDevice = useMemo(() => {
    const device = installation.devices?.find(isHomeBatteryDevice);
    return device;
  }, [installation.devices]);

  const batterySn = homeBatteryDevice?.serialNumber;

  return { homeBatteryDevice, batterySn };
}
