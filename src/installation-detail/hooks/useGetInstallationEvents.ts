import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";
import { EventType } from "../../api-client/models";

export function useGetInstallationEvents(
  installationUuid: string,
  eventType?: EventType,
) {
  const apiClient = useApiClient();

  const {
    data: eventsData,
    error: eventsError,
    isPending: isLoadingEvents,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["installationEvents", installationUuid, eventType ?? "all"],
    queryFn: () => {
      return apiClient.adminGetInstallationEvents({
        installationUuid: installationUuid,
        eventType: eventType,
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
