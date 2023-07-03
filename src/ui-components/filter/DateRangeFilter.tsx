import React from 'react'
import { omit } from 'lodash-es'

import classes from './DateRangeFilter.module.css'

interface Props<T extends object> {
  setFilters: (setFiltersFunc: (oldFilters: T) => T) => void
  minFilterKey: keyof T
  maxFilterKey: keyof T
  inputType?: React.HTMLInputTypeAttribute
} 

const MAX_DATE = new Date().toISOString().slice(0,-8)

export function DateRangeFilter<T extends object>({
  setFilters,
  minFilterKey,
  maxFilterKey
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
    [setFilters, minFilterKey]
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
    [setFilters, maxFilterKey]
  );

  return (
    <div className={classes['date-range-filter-container']}>
      <input type="datetime-local" max={MAX_DATE} onChange={onChangeMinDate} />
      <input type="datetime-local" max={MAX_DATE} onChange={onChangeMaxDate} />
    </div>
  );
}