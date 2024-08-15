import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";

export const useGetZuperJobs = (orderNumber: string) => {
  const apiClient = useApiClient();
  const {
    data: zuperJobsResponse,
    isLoading: isLoadingZuperJobs,
    error: zuperJobsError,
    refetch: refetchZuperJobs,
  } = useQuery({
    queryKey: ["zuperJobs", orderNumber],
    queryFn: () => apiClient.adminGetZuperJobsByOrderNumber({ orderNumber }),
  });

  const zuperJobs = zuperJobsResponse?.result;

  return {
    zuperJobs,
    isLoadingZuperJobs,
    zuperJobsError,
    refetchZuperJobs,
  };
};
