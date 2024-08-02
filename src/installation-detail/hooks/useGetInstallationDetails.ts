import { useQuery } from "react-query";
import { useApiClient } from "../../api-client/context";

export const useGetInstallationDetails = (orderNumber: string) => {
  const apiClient = useApiClient();
  const {
    data: installationDetailsResponse,
    status,
    error: installationDetailsError,
  } = useQuery(["installationDetail", orderNumber], () =>
    apiClient.adminGetInstallation({ orderNumber }),
  );

  const isLoadingInstallationDetails = status === "loading";
  const installationDetails = installationDetailsResponse?.result;

  return {
    installationDetails,
    isLoadingInstallationDetails,
    installationDetailsError,
  };
};
