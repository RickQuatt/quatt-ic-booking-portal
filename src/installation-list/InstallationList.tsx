import { AdminInstallationsList } from "../api-client/models";
import {
  TBody,
  THead,
  Table,
  Td,
  TdText,
  Th,
  Tr,
} from "../ui-components/table/Table";
import classes from "./InstallationList.module.css";
import { formatDate } from "../utils/formatDate";
import { ButtonLink } from "../ui-components/button/Button";
import {
  getGrafanaDataPerCICLink,
  getMenderLink,
} from "../cic-detail/getLinks";
import { Link } from "wouter";
import React from "react";
import { InstallationFilters } from "./filters/types";
import { filterInstallationList } from "./filters/filterInstallationList";
import { usePaginate } from "../ui-components/pagination/usePaginate";
import {
  ActiveCicFilter,
  CreatedAtFilter,
  InstallationIdFilter,
  OrderNumberFilter,
  UpdatedAtFilter,
} from "./filters/Filters";
import { Pagination } from "../ui-components/pagination/Pagination";

export function InstallationList({ data }: { data: AdminInstallationsList[] }) {
  const [filters, doSetFilters] = React.useState<InstallationFilters>({});

  const hasFilters = React.useMemo(() => {
    return Object.values(filters).length;
  }, [filters]);

  const filteredItems = React.useMemo(
    () => filterInstallationList(data, filters),
    [data, filters],
  );

  const { paginatedItems, paginationRange, currentPage, changePage } =
    usePaginate({
      items: filteredItems,
      pageSize: 50,
    });

  const setFilters = React.useCallback(
    (filters: React.SetStateAction<InstallationFilters>) => {
      doSetFilters(filters);
      changePage(1);
    },
    [changePage],
  );

  return (
    <div className={classes.page}>
      <h2 className={classes["page-title"]}>
        🛠️ Installations list: {filteredItems.length}{" "}
        {hasFilters ? "filtered " : ""} results
      </h2>
      <Table gridClass={classes["table-grid"]}>
        <THead>
          <Tr>
            <Th>
              <TdText>Installation id</TdText>
            </Th>
            <Th>
              <TdText>Order number</TdText>
            </Th>
            <Th>
              <TdText>Active CIC</TdText>
            </Th>
            <Th>
              <TdText>Created at</TdText>
            </Th>
            <Th>
              <TdText>Updated at</TdText>
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
              <InstallationIdFilter setFilters={setFilters} />
            </Th>
            <Th>
              <OrderNumberFilter setFilters={setFilters} />
            </Th>
            <Th>
              <ActiveCicFilter setFilters={setFilters} />
            </Th>
            <Th>
              <CreatedAtFilter setFilters={setFilters} />
            </Th>
            <Th>
              <UpdatedAtFilter setFilters={setFilters} />
            </Th>
            <Th></Th>
            <Th></Th>
            <Th></Th>
          </Tr>
        </THead>
        <TBody>
          {paginatedItems.map((installation) => (
            <InstallationRow
              key={installation.externalId}
              installation={installation}
            />
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

  function InstallationRow({
    installation,
  }: {
    installation: AdminInstallationsList;
  }) {
    const installationDetailLink = `/installations/${installation.externalId}`;
    return (
      <Tr>
        <Td>
          <TdText>
            <span title={installation.externalId}>
              <Link to={installationDetailLink}>{installation.externalId}</Link>
            </span>
          </TdText>
        </Td>
        <Td>
          <TdText>{installation.orderNumber}</TdText>
        </Td>
        <Td>
          <TdText>{installation.cicId}</TdText>
        </Td>
        <Td>
          <TdText>{formatDate(installation.createdAt)}</TdText>
        </Td>
        <Td>
          <TdText>{formatDate(installation.updatedAt)}</TdText>
        </Td>
        <Td>
          {installation.menderId && (
            <ButtonLink
              href={getMenderLink(installation.menderId)}
              target="_blank"
            >
              Mender
            </ButtonLink>
          )}
        </Td>
        <Td>
          <ButtonLink
            href={getGrafanaDataPerCICLink(installation.cicId)}
            target="_blank"
          >
            Grafana
          </ButtonLink>
        </Td>
        <Td>
          <Link to={installationDetailLink}>
            <ButtonLink>Details</ButtonLink>
          </Link>
        </Td>
      </Tr>
    );
  }
}
