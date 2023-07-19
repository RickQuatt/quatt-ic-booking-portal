import React from "react";
import { debounce, omit } from "lodash-es";

import { Input } from "../input/Input";

export function TextFilter<T extends object>({
  setFilters,
  filterKey,
  inputType = "text",
}: {
  setFilters: (setFiltersFunc: (oldFilters: T) => T) => void;
  filterKey: keyof T;
  inputType?: React.HTMLInputTypeAttribute;
}) {
  const doSetFilters = React.useCallback(
    (value: string) => {
      setFilters((filters: T) => {
        if (!value) {
          return omit(filters, filterKey) as T;
        }
        const parsedValue = inputType === "number" ? Number(value) : value;
        return { ...filters, [filterKey]: parsedValue };
      });
    },
    [setFilters, filterKey, inputType],
  );

  const debouncedSetFilters = React.useMemo(
    () => debounce(doSetFilters, 100),
    [doSetFilters],
  );

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      debouncedSetFilters(value);
    },
    [debouncedSetFilters],
  );

  return <Input type={inputType} onChange={onChange} />;
}
