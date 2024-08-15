import React from "react";

import classes from "./CICHealthList.module.css";
import { AdminCic } from "../api-client/models";
import {
  TBody,
  THead,
  Table,
  Td,
  TdText,
  Th,
  Tr,
} from "../ui-components/table/Table";
import { usePaginate } from "../ui-components/pagination/usePaginate";
import { Link } from "wouter";
import { Pagination } from "../ui-components/pagination/Pagination";
import type { CICFilters } from "../cic-list/filters/types";
import { filterCICList } from "../cic-list/filters/filterCICList";
import { IDFilter, OrderNumberFilter } from "../cic-list/filters/Filters";
import { useLocation, useSearch } from "wouter";
import {
  parseCICFiltersString,
  stringifyCICFilters,
} from "../cic-list/filters/url";
import { HealthCheckCircle } from "./HealthCheckCircle";

export function CICHealthList({ data }: { data: AdminCic[] }) {
  const [, navigate] = useLocation();
  const queryParams = useSearch();
  const filters = React.useMemo(() => {
    return parseCICFiltersString(queryParams.substring(1));
  }, [queryParams]);

  const hasFilters = React.useMemo(() => {
    return Object.values(filters).length;
  }, [filters]);

  const filteredItems = React.useMemo(
    () => filterCICList(data, filters),
    [data, filters],
  );

  const { paginatedItems, paginationRange, currentPage, changePage } =
    usePaginate({
      items: filteredItems,
      pageSize: 50,
    });

  // TODO: use useEffectEvent for this when that releases because this causes too many rerenders
  const setFilters = React.useCallback(
    (newFiltersOrFunc: React.SetStateAction<CICFilters>) => {
      const newFilters =
        typeof newFiltersOrFunc === "function"
          ? newFiltersOrFunc(filters)
          : filters;
      changePage(1);
      return navigate(`/cicHealth?${stringifyCICFilters(newFilters)}`);
    },
    [filters, changePage],
  );

  return (
    <div className={classes.page}>
      <h2 className={classes["page-title"]}>
        CIC health list, {filteredItems.length} {hasFilters ? "filtered " : ""}
        results
      </h2>
      <Table gridClass={classes["table-grid"]}>
        <THead>
          <Tr>
            <Th></Th>
            <Th>
              <TdText>Order number</TdText>
            </Th>
            <Th>
              <TdText>ID</TdText>
            </Th>
            <Th>
              <TdText>Settings</TdText>
            </Th>
            <Th>
              <TdText>Connectivity</TdText>
            </Th>
            <Th>
              <TdText>IO connectivity</TdText>
            </Th>
            <Th>
              <TdText>Controller</TdText>
            </Th>
            <Th>
              <TdText>Heat pump</TdText>
            </Th>
            <Th>
              <TdText>CIC</TdText>
            </Th>
            <Th>
              <TdText>Updates</TdText>
            </Th>
          </Tr>
          <Tr>
            <Th></Th>
            <Th>
              <OrderNumberFilter setFilters={setFilters} />
            </Th>
            <Th>
              <IDFilter setFilters={setFilters} />
            </Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
          </Tr>
        </THead>
        <TBody>
          {paginatedItems.map((cicEntry) => (
            <CICRow key={cicEntry.id} cicEntry={cicEntry} />
          ))}
        </TBody>
      </Table>
      <Pagination
        paginationRange={paginationRange}
        currentPage={currentPage}
        changePage={changePage}
      />
    </div>
  );
}

function CICRow({ cicEntry }: { cicEntry: AdminCic }) {
  const cicDetailLink = `/cics/${cicEntry.id}`;

  return (
    <Tr>
      <Td>
        <HealthCheckCircle status={cicEntry.healthCheck} />
      </Td>
      <Td>
        <TdText>{cicEntry.orderNumber}</TdText>
      </Td>
      <Td>
        <TdText>
          <Link to={cicDetailLink}>{cicEntry.id}</Link>
        </TdText>
      </Td>
      <Td>
        <HealthCheckCircle status={cicEntry.healthChecksByCategory.settings} />
      </Td>
      <Td>
        <HealthCheckCircle
          status={cicEntry.healthChecksByCategory.connectivity}
        />
      </Td>
      <Td>
        <HealthCheckCircle
          status={cicEntry.healthChecksByCategory.io_connectivity}
        />
      </Td>
      <Td>
        <HealthCheckCircle
          status={cicEntry.healthChecksByCategory.controller}
        />
      </Td>
      <Td>
        <HealthCheckCircle status={cicEntry.healthChecksByCategory.heatpump} />
      </Td>
      <Td>
        <HealthCheckCircle
          status={cicEntry.healthChecksByCategory.cic_software}
        />
      </Td>
      <Td>
        <HealthCheckCircle status={cicEntry.healthChecksByCategory.updates} />
      </Td>
    </Tr>
  );
}
