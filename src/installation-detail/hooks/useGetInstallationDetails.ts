import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";

export const useGetInstallationDetails = (iuid: string) => {
  const apiClient = useApiClient();
  const {
    data: installationDetailsResponse,
    isLoading: isLoadingInstallationDetails,
    error: installationDetailsError,
    refetch: refetchInstallationDetails,
  } = useQuery({
    queryKey: ["installationDetail", iuid],
    queryFn: () => apiClient.adminGetInstallation({ orderNumber: iuid }),
  });

  const installationDetails = installationDetailsResponse?.result;

  return {
    installationDetails,
    isLoadingInstallationDetails,
    installationDetailsError,
    refetchInstallationDetails,
  };
};
