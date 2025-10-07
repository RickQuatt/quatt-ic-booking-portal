import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";

export const useGetSnowflakeInfo = (installationUuid: string) => {
  const apiClient = useApiClient();
  const {
    data: snowflakeInfoResponse,
    isLoading: isLoadingSnowflakeInfo,
    error: snowflakeInfoError,
    refetch: refetchSnowflakeInfo,
  } = useQuery({
    queryKey: ["installationSnowflakeInfo", installationUuid],
    queryFn: () =>
      apiClient.adminGetInstallationSnowflakeInfo({ installationUuid }),
  });

  const snowflakeInfo = snowflakeInfoResponse?.result;

  return {
    snowflakeInfo,
    isLoadingSnowflakeInfo,
    snowflakeInfoError,
    refetchSnowflakeInfo,
  };
};
