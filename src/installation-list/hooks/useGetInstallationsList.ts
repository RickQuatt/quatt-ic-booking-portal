import { useQuery } from "@tanstack/react-query";
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
    ? prependPrefixIfMissing("QUATT", orderNumber.trim())
    : orderNumber;

  const cicIdWithPrefix = cicId
    ? prependPrefixIfMissing("CIC-", cicId.trim())
    : cicId;

  const {
    data,
    isLoading,
    error,
    refetch: refetchInstallations,
  } = useQuery({
    queryKey: ["installationList", { cicId, orderNumber }],
    queryFn: () =>
      apiClient.adminInstallationsList({
        cicId: cicIdWithPrefix,
        orderNumber: orderNumberWithPrefix ?? undefined,
      }),
    refetchOnWindowFocus: false,
    enabled: isFilterAtLeastThreeChars,
  });

  const installations = data?.result;

  return { installations, isLoading, error, refetchInstallations };
};
