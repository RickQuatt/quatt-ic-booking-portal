import React from 'react'
import { omit } from 'lodash-es'
import { Select } from '../select/Select'


export function SelectFilter<T extends object>({
  setFilters,
  filterKey,
  children
}: {
  setFilters: (setFiltersFunc: (oldFilters: T) => T) => void
  filterKey: keyof T,
  children: React.ReactNode;
}) {
  const onChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFilters((filters: T) => {
      if (!value) {
        return omit(filters, filterKey) as T
      }
      return { ...filters, [filterKey]: value }
    })
  }, [setFilters, filterKey])

  return (
    <Select onChange={onChange}>
      {children}
    </Select>
  )
}