import React from "react";
import { useSearch } from "wouter/use-location";

export const useQueryParams = () => {
  const location = useSearch();
  const queryParams = React.useMemo(() => {
    const urlSearchParams = new URLSearchParams(location);
    return Object.fromEntries(urlSearchParams);
  }, [location]);

  return queryParams;
};
