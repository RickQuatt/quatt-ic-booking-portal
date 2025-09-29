import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";

export function useGetInstallationEvents(installationUuid: string) {
  const apiClient = useApiClient();

  const {
    data: eventsData,
    error: eventsError,
    isPending: isLoadingEvents,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["installationEvents", installationUuid],
    queryFn: () => {
      return apiClient.adminGetInstallationEvents({
        installationUuid: installationUuid,
      });
    },
  });

  return {
    events: eventsData?.result,
    eventsError,
    isLoadingEvents,
    refetchEvents,
  };
}
