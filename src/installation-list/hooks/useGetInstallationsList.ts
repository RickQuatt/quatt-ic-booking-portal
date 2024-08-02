import { useQuery } from "react-query";
import { useApiClient } from "../../api-client/context";
import { prependPrefixIfMissing } from "../../utils/string";

export const useGetInstallationsList = (
  cicId?: string,
  orderNumber?: string | null,
) => {
  const apiClient = useApiClient();
  const cicIdOrEmptyString = cicId ?? "";
  const orderNumberOrEmptyString = orderNumber ?? "";
  const isFilterAtLeastThreeChars =
    cicIdOrEmptyString.length >= 3 || orderNumberOrEmptyString.length >= 3;

  const orderNumberWithPrefix = orderNumber
    ? prependPrefixIfMissing("QUATT", orderNumber)
    : orderNumber;

  const cicIdWithPrefix = cicId ? prependPrefixIfMissing("CIC-", cicId) : cicId;

  const { data, status, error } = useQuery(
    ["installationList", { cicId, orderNumber }],
    () =>
      apiClient.adminInstallationsList({
        cicId: cicIdWithPrefix,
        orderNumber: orderNumberWithPrefix ?? undefined,
      }),
    { refetchOnWindowFocus: false, enabled: isFilterAtLeastThreeChars },
  );

  const installations = data?.result;
  const isLoading = status === "loading";

  return { installations, isLoading, error };
};
