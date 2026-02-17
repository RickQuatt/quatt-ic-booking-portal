import { $api } from "@/openapi-client/context";
import { format } from "date-fns";
import type { TimeGranularity } from "../types/insights.types";

interface UseGetInstallationInsightsParams {
  installationUuid: string;
  from: Date;
  timeGranularity: TimeGranularity;
}

export function useGetInstallationInsights({
  installationUuid,
  from,
  timeGranularity,
}: UseGetInstallationInsightsParams) {
  const {
    data: insightsData,
    error: insightsError,
    isPending: isLoadingInsights,
    refetch: refetchInsights,
    isFetching: isFetchingInsights,
  } = $api.useQuery(
    "get",
    "/admin/installation/{installationUuid}/insights",
    {
      params: {
        path: { installationUuid },
        query: {
          from: format(from, "yyyy-MM-dd"),
          timeframe: timeGranularity,
        },
      },
    },
    {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      enabled: Boolean(installationUuid),
    },
  );

  return {
    insights: insightsData?.result,
    insightsError,
    isLoadingInsights,
    isFetchingInsights,
    refetchInsights,
  };
}
