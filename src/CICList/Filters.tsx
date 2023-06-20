import React from 'react'
import { debounce, omit } from 'lodash-es'

import classes from './Filters.module.css'
import { CICEntry, CICEntryList } from "../types";

export type CICFilters = 
  Partial<Omit<CICEntry, 'created_at'>>
  & {
    minCreatedAt?: CICEntry['createdAt']
    maxCreatedAt?: CICEntry['createdAt']
    minLastConnectionStatusUpdatedAt?: CICEntry['lastConnectionStatusUpdatedAt']
    maxLastConnectionStatusUpdatedAt?: CICEntry['lastConnectionStatusUpdatedAt']
  }

export function filterCICList(
  list: CICEntryList,
  filters: CICFilters
) {
  const minCreatedDate = filters.minCreatedAt ? new Date(filters.minCreatedAt) : null
  const maxCreatedDate = filters.maxCreatedAt ? new Date(filters.maxCreatedAt) : null
  const minLastConnectionStatusUpdatedAt = filters.minLastConnectionStatusUpdatedAt ? new Date(filters.minLastConnectionStatusUpdatedAt) : null
  const maxLastConnectionStatusUpdatedAt = filters.maxLastConnectionStatusUpdatedAt ? new Date(filters.maxLastConnectionStatusUpdatedAt) : null

  return list.filter(cicEntry => {
    return Object.entries(filters).every(([filterKey, filterValue]) => {
      if (minCreatedDate && filterKey === 'minCreatedAt') {
        const createdDate = new Date(cicEntry.createdAt)
        return minCreatedDate < createdDate
      }
      if (maxCreatedDate && filterKey === 'maxCreatedAt') {
        const createdDate = new Date(cicEntry.createdAt)
        return maxCreatedDate > createdDate
      }
      if (minLastConnectionStatusUpdatedAt && filterKey === 'minLastConnectionStatusUpdatedAt') {
        const lastConnectionStatusUpdatedAt = new Date(cicEntry.lastConnectionStatusUpdatedAt)
        return minLastConnectionStatusUpdatedAt < lastConnectionStatusUpdatedAt
      }
      if (maxLastConnectionStatusUpdatedAt && filterKey === 'maxLastConnectionStatusUpdatedAt') {
        const lastConnectionStatusUpdatedAt = new Date(cicEntry.lastConnectionStatusUpdatedAt)
        return maxLastConnectionStatusUpdatedAt > lastConnectionStatusUpdatedAt
      }

      return filterValue === cicEntry[filterKey as keyof CICEntry]
    })
  })
}

export function TextFilter({
  setFilters,
  filterKey,
  inputType = 'text'
}: {
  setFilters: SetFiltersFunc
  filterKey: keyof CICEntry
  inputType?: React.HTMLInputTypeAttribute
}) {
  const doSetFilters = React.useCallback((value: string) => {
    setFilters((filters: CICFilters) => {
      console.log(value)
      if (!value) {
        return omit(filters, filterKey)
      }
      const parsedValue = inputType === 'number' ? Number(value) : value
      return { ...filters, [filterKey]: parsedValue }
    })
  }, [setFilters, filterKey, inputType])

  const debouncedSetFilters = React.useMemo(
    () => debounce(doSetFilters, 100),
    [doSetFilters]
  )

  const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    debouncedSetFilters(value)
  }, [debouncedSetFilters])

  return (
    <input
      type={inputType}
      onChange={onChange}
    />
  )
}

type SetFiltersFunc = (setFiltersFunc: (oldFilters: CICFilters) => CICFilters) => void
type FilterProps = { setFilters: SetFiltersFunc }

export function IDFilter({ setFilters }: FilterProps) {
  return (
    <TextFilter setFilters={setFilters} filterKey={"id"} />
  )
}

export function CableConnectionStatusFilter({
  setFilters
}: {
  setFilters: SetFiltersFunc
}) {
  const onChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CICEntry['cableConnectionStatus']
    setFilters((filters: CICFilters) => {
      if (!value) {
        return omit(filters, 'cableConnectionStatus')
      }
      return { ...filters, cableConnectionStatus: value }
    })
  }, [setFilters])

  return (
    <select onChange={onChange}>
      <option value="">Any</option>
      <option value="connected">Connected</option>
      <option value="disconnected">Disconnected</option>
      <option value="not_reachable">Not reachable</option>
    </select>
  )
}

export function WifiConnectionStatusFilter({
  setFilters
}: {
  setFilters: SetFiltersFunc
}) {
  const onChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CICEntry['wifiConnectionStatus']
    setFilters((filters: CICFilters) => {
      if (!value) {
        return omit(filters, 'wifiConnectionStatus')
      }
      return { ...filters, wifiConnectionStatus: value }
    })
  }, [setFilters])

  return (
    <select onChange={onChange}>
      <option value="">Any</option>
      <option value="connected">Connected</option>
      <option value="disconnected">Disconnected</option>
      <option value="not_reachable">Not reachable</option>
    </select>
  )
}


export function LTEConnectionStatusFilter({
  setFilters
}: {
  setFilters: SetFiltersFunc
}) {
  const onChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CICEntry['lteConnectionStatus']
    setFilters((filters: CICFilters) => {
      if (!value) {
        return omit(filters, 'lteConnectionStatus')
      }
      return { ...filters, lteConnectionStatus: value }
    })
  }, [setFilters])

  return (
    <select onChange={onChange}>
      <option value="">Any</option>
      <option value="connected">Connected</option>
      <option value="disconnected">Disconnected</option>
      <option value="not_reachable">Not reachable</option>
    </select>
  )
}

export function SupervisoryControlModeFilter({ setFilters }: FilterProps) {
  return (
    <TextFilter
      setFilters={setFilters}
      filterKey={"supervisoryControlMode"}
      inputType='number'
    />
  )
}

export function OrderNumberFilter({ setFilters }: FilterProps) {
  return (
    <TextFilter
      setFilters={setFilters}
      filterKey={"orderNumber"}
    />
  )
}

const maxDate = new Date().toISOString().slice(0,-8)

export function CreatedDateFilter({ setFilters }: FilterProps) {
  const onChangeMinDate = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as CICEntry['createdAt']
    setFilters((filters: CICFilters) => {
      if (!value) {
        return omit(filters, 'minCreatedAt')
      }
      return { ...filters, minCreatedAt: value }
    })
  }, [setFilters])

  const onChangeMaxDate = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as CICEntry['createdAt']
    setFilters((filters: CICFilters) => {
      if (!value) {
        return omit(filters, 'maxCreatedAt')
      }
      return { ...filters, maxCreatedAt: value }
    })
  }, [setFilters])

  return (
    <div className={classes['created-date-filter-container']}>
      <input
        type="datetime-local"
        max={maxDate}
        onChange={onChangeMinDate}
      />
      <input
        type="datetime-local"
        max={maxDate}
        onChange={onChangeMaxDate}
      />
    </div>
  )
}

export function LastConnectionStatusFilter({ setFilters }: FilterProps) {
  const onChangeMinDate = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as CICEntry['lastConnectionStatusUpdatedAt']
    setFilters((filters: CICFilters) => {
      if (!value) {
        return omit(filters, 'minLastConnectionStatusUpdatedAt')
      }
      return { ...filters, minLastConnectionStatusUpdatedAt: value }
    })
  }, [setFilters])

  const onChangeMaxDate = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as CICEntry['createdAt']
    setFilters((filters: CICFilters) => {
      if (!value) {
        return omit(filters, 'maxLastConnectionStatusUpdatedAt')
      }
      return { ...filters, maxLastConnectionStatusUpdatedAt: value }
    })
  }, [setFilters])

  return (
    <div className={classes['created-date-filter-container']}>
      <input
        type="datetime-local"
        max={maxDate}
        onChange={onChangeMinDate}
      />
      <input
        type="datetime-local"
        max={maxDate}
        onChange={onChangeMaxDate}
      />
    </div>
  )
}