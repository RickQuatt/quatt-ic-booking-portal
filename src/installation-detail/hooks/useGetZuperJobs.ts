import { useQuery } from "react-query";
import { useApiClient } from "../../api-client/context";

export const useGetZuperJobs = (orderNumber: string) => {
  const apiClient = useApiClient();
  const {
    data: zuperJobsResponse,
    status,
    error: zuperJobsError,
  } = useQuery(["zuperJobs", orderNumber], () =>
    apiClient.adminGetZuperJobsByOrderNumber({ orderNumber }),
  );

  const isLoadingZuperJobs = status === "loading";
  const zuperJobs = zuperJobsResponse?.result;

  return {
    zuperJobs,
    isLoadingZuperJobs,
    zuperJobsError,
  };
};
