import React from "react";
import { omit } from "lodash-es";

import { AdminCic } from "../api-client/models";
import { Select } from "../ui-components/select/Select";
import { TextFilter } from "../ui-components/filter/TextFilter";
import { DateRangeFilter } from "../ui-components/filter/DateRangeFilter";
import { fuzzyMatch } from "../ui-components/filter/utils";

export type CICFilters = Partial<Omit<AdminCic, "created_at">> & {
  minCreatedAt?: AdminCic["createdAt"];
  maxCreatedAt?: AdminCic["createdAt"];
  minLastConnectionStatusUpdatedAt?: AdminCic["lastConnectionStatusUpdatedAt"];
  maxLastConnectionStatusUpdatedAt?: AdminCic["lastConnectionStatusUpdatedAt"];
};

export function filterCICList(list: AdminCic[], filters: CICFilters) {
  return list.filter((cicEntry) => {
    return Object.entries(filters).every(([filterKey, filterValue]) => {
      if (filters.minCreatedAt && filterKey === "minCreatedAt") {
        const createdDate = cicEntry.createdAt;
        return filters.minCreatedAt < createdDate;
      }
      if (filters.maxCreatedAt && filterKey === "maxCreatedAt") {
        const createdDate = cicEntry.createdAt;
        return filters.maxCreatedAt > createdDate;
      }

      if (
        filters.minLastConnectionStatusUpdatedAt &&
        filterKey === "minLastConnectionStatusUpdatedAt"
      ) {
        if (!cicEntry.lastConnectionStatusUpdatedAt) return false;
        return (
          filters.minLastConnectionStatusUpdatedAt <
          cicEntry.lastConnectionStatusUpdatedAt
        );
      }
      if (
        filters.maxLastConnectionStatusUpdatedAt &&
        filterKey === "maxLastConnectionStatusUpdatedAt"
      ) {
        if (!cicEntry.lastConnectionStatusUpdatedAt) return false;
        return (
          filters.maxLastConnectionStatusUpdatedAt >
          cicEntry.lastConnectionStatusUpdatedAt
        );
      }

      if (filters.id && filterKey === "id") {
        return fuzzyMatch(cicEntry.id, filters.id);
      }

      if (filters.orderNumber && filterKey === "orderNumber") {
        return fuzzyMatch(cicEntry.orderNumber, filters.orderNumber);
      }

      return filterValue === cicEntry[filterKey as keyof AdminCic];
    });
  });
}

type SetFiltersFunc = (
  setFiltersFunc: (oldFilters: CICFilters) => CICFilters,
) => void;
type FilterProps = { setFilters: SetFiltersFunc };

export function IDFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"id"} />;
}

export function CableConnectionStatusFilter({
  setFilters,
}: {
  setFilters: SetFiltersFunc;
}) {
  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as AdminCic["cableConnectionStatus"];
      setFilters((filters: CICFilters) => {
        if (!value) {
          return omit(filters, "cableConnectionStatus");
        }
        return { ...filters, cableConnectionStatus: value };
      });
    },
    [setFilters],
  );

  return (
    <Select onChange={onChange}>
      <option value="">Any</option>
      <option value="connected">Connected</option>
      <option value="disconnected">Disconnected</option>
      <option value="not_reachable">Not reachable</option>
    </Select>
  );
}

export function WifiConnectionStatusFilter({
  setFilters,
}: {
  setFilters: SetFiltersFunc;
}) {
  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as AdminCic["wifiConnectionStatus"];
      setFilters((filters: CICFilters) => {
        if (!value) {
          return omit(filters, "wifiConnectionStatus");
        }
        return { ...filters, wifiConnectionStatus: value };
      });
    },
    [setFilters],
  );

  return (
    <Select onChange={onChange}>
      <option value="">Any</option>
      <option value="connected">Connected</option>
      <option value="disconnected">Disconnected</option>
      <option value="not_reachable">Not reachable</option>
    </Select>
  );
}

export function LTEConnectionStatusFilter({
  setFilters,
}: {
  setFilters: SetFiltersFunc;
}) {
  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as AdminCic["lteConnectionStatus"];
      setFilters((filters: CICFilters) => {
        if (!value) {
          return omit(filters, "lteConnectionStatus");
        }
        return { ...filters, lteConnectionStatus: value };
      });
    },
    [setFilters],
  );

  return (
    <Select onChange={onChange}>
      <option value="">Any</option>
      <option value="connected">Connected</option>
      <option value="disconnected">Disconnected</option>
      <option value="not_reachable">Not reachable</option>
    </Select>
  );
}

export function SupervisoryControlModeFilter({ setFilters }: FilterProps) {
  return (
    <TextFilter
      setFilters={setFilters}
      filterKey={"supervisoryControlMode"}
      inputType="number"
    />
  );
}

export function OrderNumberFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"orderNumber"} />;
}

export function CreatedDateFilter({ setFilters }: FilterProps) {
  return (
    <DateRangeFilter
      setFilters={setFilters}
      minFilterKey="minCreatedAt"
      maxFilterKey="maxCreatedAt"
    />
  );
}

export function LastConnectionStatusFilter({ setFilters }: FilterProps) {
  return (
    <DateRangeFilter
      setFilters={setFilters}
      minFilterKey="minLastConnectionStatusUpdatedAt"
      maxFilterKey="maxLastConnectionStatusUpdatedAt"
    />
  );
}
