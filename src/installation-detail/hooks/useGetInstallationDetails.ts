import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";

export const useGetInstallationDetails = (installationUuid: string) => {
  const apiClient = useApiClient();
  const {
    data: installationDetailsResponse,
    isLoading: isLoadingInstallationDetails,
    error: installationDetailsError,
    refetch: refetchInstallationDetails,
  } = useQuery({
    queryKey: ["installationDetail", installationUuid],
    queryFn: () => apiClient.adminGetInstallation({ installationUuid }),
  });

  const installationDetails = installationDetailsResponse?.result;

  return {
    installationDetails,
    isLoadingInstallationDetails,
    installationDetailsError,
    refetchInstallationDetails,
  };
};
