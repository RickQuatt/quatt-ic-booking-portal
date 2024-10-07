import { useApiClient } from "../../api-client/context";

const useRebootCic = (cicId: string) => {
  const apiClient = useApiClient();

  const rebootCic = async () => {
    if (!window.confirm("Are you sure you would like to reboot the CIC?")) {
      return;
    }

    const response = await apiClient.adminRebootCIC({ cicId });

    if (response.meta.status === 200) {
      alert("Reboot request sent successfully.");
    } else {
      alert("Failed to send reboot request.");
    }
  };

  return rebootCic;
};

export default useRebootCic;
