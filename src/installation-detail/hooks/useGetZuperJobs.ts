import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";

export const useGetZuperJobs = (
  installationUuid: string,
  orderNumber?: string | null,
) => {
  const apiClient = useApiClient();
  const {
    data: zuperJobsResponse,
    isLoading: isLoadingZuperJobs,
    error: zuperJobsError,
    refetch: refetchZuperJobs,
  } = useQuery({
    queryKey: ["zuperJobs", installationUuid],
    queryFn: () =>
      apiClient.adminGetZuperJobsByInstallationUuid({
        orderNumber: orderNumber as string | undefined,
        installationUuid,
      }),
  });

  const zuperJobs = zuperJobsResponse?.result;

  return {
    zuperJobs,
    isLoadingZuperJobs,
    zuperJobsError,
    refetchZuperJobs,
  };
};
