import React from "react"
import { Installer } from "../api-client/models"
import { TextFilter } from "../ui-components/filter/TextFilter"
import { SelectFilter } from "../ui-components/filter/SelectFilter"
import { DateRangeFilter } from "../ui-components/filter/DateRangeFilter"

export type InstallerFilters = 
  Partial<Pick<Installer, 'code' | 'name' | 'phone' | 'isActive'>>
  & {
    minCreatedAt?: Installer['createdAt']
    maxCreatedAt?: Installer['createdAt']
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
        const createdDate = new Date(cicEntry.createdAt)
        return filters.maxCreatedAt > createdDate
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
    <TextFilter setFilters={setFilters} filterKey={"phone"} />
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
