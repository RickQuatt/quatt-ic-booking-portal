import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../../api-client/context";
import { GetAdminDynamicPrices200Response } from "../../api-client/models/GetAdminDynamicPrices200Response";
import { PricingItem } from "../../api-client/models/PricingItem";
import { PricingDataPoint } from "../../types";

// Create formatters at module scope for performance optimization
const hourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Amsterdam",
  hour: "numeric",
  hour12: false,
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Amsterdam",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
interface PricingResponse {
  currentPrice: number;
  currentGasPrice: number;
  hourlyPrices: PricingDataPoint[];
}

export function usePricingData(selectedDate: Date) {
  const apiClient = useApiClient();

  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const transformApiResponse = (
    apiResponse: GetAdminDynamicPrices200Response,
  ): PricingResponse => {
    const electricityPrices = apiResponse.result.prices.electricity;
    const currentElectricityPrice =
      apiResponse.result.currentPrice.electricity ?? 0;
    const currentGasPrice = apiResponse.result.currentPrice.gas ?? 0;

    const hourlyPrices: PricingDataPoint[] = electricityPrices.map(
      (item: PricingItem) => {
        const validFromDate = new Date(item.validFrom);

        // Convert to Amsterdam timezone for consistent display
        const amsterdamHour = parseInt(hourFormatter.format(validFromDate), 10);

        return {
          hour: amsterdamHour,
          price: item.price,
          timestamp: item.validFrom.toISOString(),
          validFrom: item.validFrom.toISOString(),
          validTo: item.validTo.toISOString(),
          formattedValidFrom: timeFormatter.format(item.validFrom),
          formattedValidTo: timeFormatter.format(item.validTo),
        };
      },
    );

    // Sort by hour to ensure correct chart display
    hourlyPrices.sort((a, b) => a.hour - b.hour);

    return {
      currentPrice: currentElectricityPrice,
      currentGasPrice: currentGasPrice,
      hourlyPrices,
    };
  };

  return useQuery({
    queryKey: ["dynamicPricing", formatDateForApi(selectedDate)],
    queryFn: async (): Promise<PricingResponse> => {
      // Use the real admin API endpoint
      const apiResponse = await apiClient.getAdminDynamicPrices({
        date: selectedDate,
      });

      return transformApiResponse(apiResponse);
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
