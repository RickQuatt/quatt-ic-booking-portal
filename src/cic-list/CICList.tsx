import React, { useEffect } from "react";
import { Link } from "wouter";

import classes from "./CICList.module.css";
import {
  CreatedDateFilter,
  IDFilter,
  OrderNumberFilter,
} from "./filters/Filters";
import type { CICFilters } from "./filters/types";
import { filterCICList } from "./filters/filterCICList";
import { ButtonLink } from "../ui-components/button/Button";
import { AdminCic, ConnectionStatus } from "../api-client/models";
import { formatDate, formatDateDistance } from "../utils/formatDate";
import {
  getGrafanaDataPerCICLink,
  getMenderLink,
} from "../cic-detail/getLinks";
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
import { Pagination } from "../ui-components/pagination/Pagination";
import ErrorText from "../ui-components/error-text/ErrorText";
import { useApiClient } from "../api-client/context";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "../ui-components/loader/Loader";

export function CICList() {
  const apiClient = useApiClient();

  const [filters, doSetFilters] = React.useState<CICFilters>({});

  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 50,
  });
  const hasFilters = React.useMemo(() => {
    return Object.values(filters).length;
  }, [filters]);

  const {
    data: results,
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey: ["cicList"],
    queryFn: () =>
      apiClient.adminListCics({
        cicId: filters.id,
        orderNumber: filters.orderNumber || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize,
        createdAtEnd: filters.maxCreatedAt,
        createdAtStart: filters.minCreatedAt,
      }),
    refetchOnWindowFocus: false,
  });

  const page = results?.result;
  const total = page?.total || 0;
  const pageSize = page?.pageSize || 0;
  const totalPages = page?.totalPages || 0;
  const cics = results?.result.cics || [];

  const filteredItems = React.useMemo(
    () => filterCICList(cics, filters),
    [cics, filters],
  );

  const { paginatedItems, paginationRange, currentPage, changePage } =
    usePaginate({
      items: cics,
      pageSize: 50,
      total,
    });

  const setFilters = React.useCallback(
    (filters: React.SetStateAction<CICFilters>) => {
      doSetFilters(filters);
      changePage(1);
    },
    [changePage],
  );

  useEffect(() => {
    refetch();
  }, [filters, pagination]);

  if (isLoading) return <Loader />;

  if (isError) {
    console.error("Failed to fetch CICs", error);
    return <ErrorText text="Failed to fetch CICs." retry={refetch} />;
  }

  const currentPageAmount =
    currentPage < totalPages ? pageSize * currentPage : total;

  return (
    <div className={classes.page}>
      <h2 className={classes["page-title"]}>
        CIC List, {currentPageAmount} {hasFilters ? "filtered " : ""} of {total}{" "}
        results
      </h2>
      <Table gridClass={classes["table-grid"]}>
        <THead>
          <Tr>
            <Th>
              <TdText>ID</TdText>
            </Th>
            <Th>
              <TdText>Cable connection status</TdText>
            </Th>
            <Th>
              <TdText>Wifi connection status</TdText>
            </Th>
            <Th>
              <TdText>LTE connection status</TdText>
            </Th>
            <Th>
              <TdText>Supervisory control mode</TdText>
            </Th>
            <Th>
              <TdText>Order number</TdText>
            </Th>
            <Th>
              <TdText>Created at</TdText>
            </Th>
            <Th>
              <TdText>Last connection status updated at</TdText>
            </Th>
            <Th>
              <TdText>Mender</TdText>
            </Th>
            <Th>
              <TdText>Grafana</TdText>
            </Th>
            <Th>
              <TdText>Details</TdText>
            </Th>
          </Tr>
          <Tr>
            <Th>
              <IDFilter setFilters={setFilters} />
            </Th>
            <Th>
              {/* <CableConnectionStatusFilter setFilters={setFilters} /> */}
            </Th>
            <Th>
              {/* <WifiConnectionStatusFilter setFilters={setFilters} /> */}
            </Th>
            <Th>
              {/* <LTEConnectionStatusFilter setFilters={setFilters} /> */}
            </Th>
            <Th>
              {/* <SupervisoryControlModeFilter setFilters={setFilters} /> */}
            </Th>
            <Th>
              <OrderNumberFilter setFilters={setFilters} />
            </Th>
            <Th>
              <CreatedDateFilter setFilters={setFilters} />
            </Th>
            <Th>
              {/* <LastConnectionStatusFilter setFilters={setFilters} /> */}
            </Th>
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
        changePage={(page) => {
          setPagination({
            ...pagination,
            page,
          });
          changePage(page);
        }}
      />
    </div>
  );
}

function CICRow({ cicEntry }: { cicEntry: AdminCic }) {
  const cicDetailLink = `/cics/${cicEntry.id}`;
  return (
    <Tr>
      <Td>
        <TdText>
          <Link to={cicDetailLink}>{cicEntry.id}</Link>
        </TdText>
      </Td>
      <Td>
        <ConnectionStatusText status={cicEntry.cableConnectionStatus} />
      </Td>
      <Td>
        <ConnectionStatusText status={cicEntry.wifiConnectionStatus} />
      </Td>
      <Td>
        <ConnectionStatusText status={cicEntry.lteConnectionStatus} />
      </Td>
      <Td>
        <TdText>{cicEntry.supervisoryControlMode}</TdText>
      </Td>
      <Td>
        <TdText>{cicEntry.orderNumber}</TdText>
      </Td>
      <Td>
        <TdText>{formatDate(cicEntry.createdAt)}</TdText>
      </Td>
      <Td>
        <TdText>
          {formatDateDistance(cicEntry.lastConnectionStatusUpdatedAt)}
        </TdText>
      </Td>
      <Td>
        {cicEntry.menderId && (
          <ButtonLink href={getMenderLink(cicEntry.menderId)} target="_blank">
            Mender
          </ButtonLink>
        )}
      </Td>
      <Td>
        <ButtonLink
          href={getGrafanaDataPerCICLink(cicEntry.id)}
          target="_blank"
        >
          Grafana
        </ButtonLink>
      </Td>
      <Td>
        <Link asChild href={cicDetailLink}>
          <ButtonLink>Detail</ButtonLink>
        </Link>
      </Td>
    </Tr>
  );
}

const getConnectionStatusText = (status: ConnectionStatus | null) => {
  switch (status) {
    case "bad_credentials":
      return "Bad Credentials";
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting";
    case "disconnected":
      return "Disconnected";
    case "not_reachable":
      return "Not Reachable";
    default:
      return status;
  }
};
const getConnectionStatusColor = (status: ConnectionStatus | null) => {
  switch (status) {
    case "bad_credentials":
    case "disconnected":
    case "not_reachable":
      return "danger";
    default:
      return undefined;
  }
};

const ConnectionStatusText = ({
  status,
}: {
  status: ConnectionStatus | null;
}) => {
  return (
    <TdText color={getConnectionStatusColor(status)}>
      {getConnectionStatusText(status)}
    </TdText>
  );
};
