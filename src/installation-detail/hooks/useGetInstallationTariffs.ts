import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";

export const useGetInstallationTariffs = (installationId: string) => {
  const apiClient = useApiClient();
  const {
    data: tariffsResponse,
    isLoading: isLoadingTariffs,
    error: tariffsError,
    refetch: refetchTariffs,
  } = useQuery({
    queryKey: ["installationTariffs", installationId],
    queryFn: () => apiClient.adminGetInstallationTariff({ installationId }),
  });

  const tariffs = tariffsResponse?.result;

  return {
    tariffs,
    isLoadingTariffs,
    tariffsError,
    refetchTariffs,
  };
};
