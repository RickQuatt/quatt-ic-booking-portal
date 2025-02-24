import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";
import { prependPrefixIfMissing } from "../../utils/string";

export const useGetInstallationsList = (
  enforce: boolean,
  cicId?: string,
  orderNumber?: string | null,
  iuid?: string | null,
  zipCode?: string | null,
  houseNumber?: string | null,
  houseAddition?: string | null,
) => {
  const apiClient = useApiClient();
  const cicIdOrEmptyString = cicId ?? "";
  const orderNumberOrEmptyString = orderNumber ?? "";
  const iuidOrEmptyString = iuid ?? "";
  const zipCodeOrEmptyString = zipCode ?? "";
  const houseNumberOrEmptyString = houseNumber ?? "";
  const houseAdditionOrEmptyString = houseAddition ?? "";
  const doesFilterHaveMinNumberOfChars =
    cicIdOrEmptyString.length >= 3 ||
    orderNumberOrEmptyString.length >= 3 ||
    iuidOrEmptyString.length >= 3 ||
    zipCodeOrEmptyString.length >= 2 ||
    houseNumberOrEmptyString.length >= 1 ||
    houseAdditionOrEmptyString.length >= 1;

  const orderNumberWithPrefix =
    orderNumber && enforce
      ? prependPrefixIfMissing("QUATT", orderNumber.trim())
      : orderNumber;

  const cicIdWithPrefix =
    cicId && enforce ? prependPrefixIfMissing("CIC-", cicId.trim()) : cicId;

  const {
    data,
    isLoading,
    error,
    refetch: refetchInstallations,
  } = useQuery({
    queryKey: [
      "installationList",
      { cicId, orderNumber, iuid, zipCode, houseNumber, houseAddition },
    ],
    queryFn: () =>
      apiClient.adminInstallationsList({
        cicId: cicIdWithPrefix,
        orderNumber: orderNumberWithPrefix ?? undefined,
        iuid: iuid ?? undefined,
        zipCode: zipCode ?? undefined,
        houseNumber: houseNumber ?? undefined,
        houseAddition: houseAddition ?? undefined,
      }),
    refetchOnWindowFocus: false,
    enabled: doesFilterHaveMinNumberOfChars,
  });

  const installations = data?.result;

  return { installations, isLoading, error, refetchInstallations };
};
