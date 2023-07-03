import React from "react"
import { Installer } from "../api-client/models"
import { TextFilter } from "../ui-components/filter/TextFilter"
import { SelectFilter } from "../ui-components/filter/SelectFilter"
import { DateRangeFilter } from "../ui-components/filter/DateRangeFilter"
import { fuzzyMatch, stringToBoolean } from "../ui-components/filter/utils"

export type InstallerFilters = 
  Partial<Pick<Installer, 'code' | 'name' | 'phone'>>
  & {
    minCreatedAt?: Installer['createdAt']
    maxCreatedAt?: Installer['createdAt']
    isActive: string
  }

type SetFiltersFunc = (setFiltersFunc: (oldFilters: InstallerFilters) => InstallerFilters) => void
type FilterProps = { setFilters: SetFiltersFunc }

export function filterInstallerList(
  list: Installer[],
  filters: InstallerFilters
) {
  return list.filter(cicEntry => {
    return Object.entries(filters).every(([filterKey, filterValue]) => {
      if (filters.minCreatedAt && filterKey === 'minCreatedAt') {
        const createdDate = cicEntry.createdAt
        return filters.minCreatedAt < createdDate
      }
      if (filters.maxCreatedAt && filterKey === 'maxCreatedAt') {
        const createdDate = cicEntry.createdAt
        return filters.maxCreatedAt > createdDate
      }

      if (filters.code && filterKey === 'code') {
        return fuzzyMatch(cicEntry.code, filters.code)
      }

      if (filters.name && filterKey === 'name') {
        return fuzzyMatch(cicEntry.name, filters.name)
      }

      if (filters.phone && filterKey === 'phone') {
        return fuzzyMatch(cicEntry.phone, filters.phone)
      }

      if (filters.isActive && filterKey === 'isActive') {
        const isActive = stringToBoolean(filters.isActive)
        return cicEntry.isActive === isActive
      }

      return filterValue === cicEntry[filterKey as keyof Installer]
    })
  })
}

export function CodeFilter({ setFilters }: FilterProps) {
  return (
    <TextFilter setFilters={setFilters} filterKey={"code"} />
  )
}

export function NameFilter({ setFilters }: FilterProps) {
  return (
    <TextFilter setFilters={setFilters} filterKey={"name"} />
  )
}

export function PhoneFilter({ setFilters }: FilterProps) {
  return (
    <TextFilter inputType="tel" setFilters={setFilters} filterKey={"phone"} />
  )
}

export function IsActiveFilter({
  setFilters
}: {
  setFilters: SetFiltersFunc
}) {
  return (
    <SelectFilter setFilters={setFilters} filterKey="isActive">
      <option value="">Any</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </SelectFilter>
  )
}

export function CreatedDateFilter({ setFilters }: FilterProps) {
  return (
    <DateRangeFilter
      setFilters={setFilters}
      minFilterKey="minCreatedAt"
      maxFilterKey="maxCreatedAt"
    />
  )
}
