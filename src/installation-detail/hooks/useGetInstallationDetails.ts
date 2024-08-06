import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";

export const useGetInstallationDetails = (orderNumber: string) => {
  const apiClient = useApiClient();
  const {
    data: installationDetailsResponse,
    isLoading: isLoadingInstallationDetails,
    error: installationDetailsError,
    refetch: refetchInstallationDetails,
  } = useQuery({
    queryKey: ["installationDetail", orderNumber],
    queryFn: () => apiClient.adminGetInstallation({ orderNumber }),
  });

  const installationDetails = installationDetailsResponse?.result;

  return {
    installationDetails,
    isLoadingInstallationDetails,
    installationDetailsError,
    refetchInstallationDetails,
  };
};
