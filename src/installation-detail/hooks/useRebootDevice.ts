import { useApiClient } from "../../api-client/context";
import { AdminRebootDeviceRequestTargetEnum } from "../../api-client/models/AdminRebootDeviceRequest";

const useRebootDevice = (
  cicId: string,
  device: AdminRebootDeviceRequestTargetEnum,
) => {
  const apiClient = useApiClient();

  const rebootDevice = async () => {
    let deviceInText = "CIC";
    if (device === AdminRebootDeviceRequestTargetEnum.HeatCharger) {
      deviceInText = "HeatCharger";
    }

    if (
      !window.confirm(
        `Are you sure you would like to reboot the ${deviceInText}?`,
      )
    ) {
      return;
    }

    const response = await apiClient.adminRebootDevice({
      cicId,
      adminRebootDeviceRequest: { target: device },
    });

    if (response.meta.status === 200) {
      alert("Reboot request sent successfully.");
    } else {
      alert("Failed to send reboot request.");
    }
  };

  return rebootDevice;
};

export default useRebootDevice;
