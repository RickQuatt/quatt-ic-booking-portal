import React from "react";
import { omit } from "lodash-es";

import classes from "./DateRangeFilter.module.css";

interface Props<T extends object> {
  setFilters: (setFiltersFunc: (oldFilters: T) => T) => void;
  minFilterKey: keyof T;
  maxFilterKey: keyof T;
  inputType?: React.HTMLInputTypeAttribute;
  filters?: T;
}

const MAX_DATE = new Date().toISOString().slice(0, -8);

export function DateRangeFilter<T extends object>({
  setFilters,
  minFilterKey,
  maxFilterKey,
  filters,
}: Props<T>) {
  const onChangeMinDate = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFilters((filters: T) => {
        if (!value) {
          return omit(filters, minFilterKey) as T;
        }
        return {
          ...filters,
          [minFilterKey]: new Date(value),
        };
      });
    },
    [setFilters, minFilterKey],
  );

  const onChangeMaxDate = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFilters((filters: T) => {
        if (!value) {
          return omit(filters, maxFilterKey) as T;
        }
        return {
          ...filters,
          [maxFilterKey]: new Date(value),
        };
      });
    },
    [setFilters, maxFilterKey],
  );

  // Get current filter values and convert Date to string for input
  const minValue = filters?.[minFilterKey];
  const maxValue = filters?.[maxFilterKey];

  const minDateString = React.useMemo(() => {
    return minValue instanceof Date ? minValue.toISOString().slice(0, -8) : "";
  }, [minValue]);

  const maxDateString = React.useMemo(() => {
    return maxValue instanceof Date ? maxValue.toISOString().slice(0, -8) : "";
  }, [maxValue]);

  return (
    <div className={classes["date-range-filter-container"]}>
      <input
        type="datetime-local"
        max={MAX_DATE}
        value={minDateString}
        onChange={onChangeMinDate}
      />
      <input
        type="datetime-local"
        max={MAX_DATE}
        value={maxDateString}
        onChange={onChangeMaxDate}
      />
    </div>
  );
}
