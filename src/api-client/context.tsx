import React from "react";

import { SupportDashboardApi } from "./apis/SupportDashboardApi";
import { Configuration } from "./runtime";
import { useContextWithCheck } from "../utils/useContextWithCheck";

const ApiClientContext = React.createContext<SupportDashboardApi | undefined>(
  undefined,
);

type ProviderProps = React.PropsWithChildren<{ token: string }>;

export const ApiClientProvider = ({ children, token }: ProviderProps) => {
  const [apiClient] = React.useState(() => {
    return new SupportDashboardApi(
      new Configuration({
        basePath: import.meta.env.VITE_API_BASE_PATH as string,
        accessToken: token,
      }),
    );
  });

  return (
    <ApiClientContext.Provider value={apiClient}>
      {children}
    </ApiClientContext.Provider>
  );
};

export const useApiClient = () => {
  return useContextWithCheck(ApiClientContext);
};
