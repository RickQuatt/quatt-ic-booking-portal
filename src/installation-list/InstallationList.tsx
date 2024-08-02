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
import { Link } from "wouter";
import React from "react";
import { InstallationFilters } from "./filters/types";
import { usePaginate } from "../ui-components/pagination/usePaginate";
import { CreatedAtFilter, UpdatedAtFilter } from "./filters/Filters";
import { Pagination } from "../ui-components/pagination/Pagination";
import { TextFilter } from "../ui-components/filter/TextFilter";
import { useGetInstallationsList } from "./hooks/useGetInstallationsList";
import { Loader } from "../ui-components/loader/Loader";
import ErrorText from "../ui-components/error-text/ErrorText";

export function InstallationList() {
  const [filters, setFilters] = React.useState<InstallationFilters>({});
  const { installations, isLoading, error } = useGetInstallationsList(
    filters.cicId,
    filters.orderNumber,
  );

  const { paginatedItems, paginationRange, currentPage, changePage } =
    usePaginate({
      items: installations || [],
      pageSize: 50,
    });

  const noInstallationsFound = installations && installations.length === 0;

  return (
    <div className={classes.page}>
      <div className={classes["page-title-container"]}>
        <h2 className={classes["page-title"]}>🛠️ Installations list</h2>
        {isLoading && (
          // TODO: Remove the div wrapper and pass styles directly to the Loader component
          <div className={classes["loader-container"]}>
            <Loader />
          </div>
        )}
      </div>
      <Table gridClass={classes["table-grid"]}>
        <THead>
          <Tr>
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
              <TdText>Details</TdText>
            </Th>
          </Tr>
          <Tr>
            <Th>
              <TextFilter filterKey="orderNumber" setFilters={setFilters} />
            </Th>
            <Th>
              <TextFilter filterKey="cicId" setFilters={setFilters} />
            </Th>
            <Th>
              <CreatedAtFilter setFilters={setFilters} />
            </Th>
            <Th>
              <UpdatedAtFilter setFilters={setFilters} />
            </Th>
            <Th></Th>
          </Tr>
        </THead>
        <TBody>
          {paginatedItems.map((installation, index) => (
            <InstallationRow key={index} installation={installation} />
          ))}
        </TBody>
      </Table>
      {noInstallationsFound && (
        <p className={classes["info-text"]}>
          No installations found with the given order number or CIC id
        </p>
      )}
      {!!error && (
        <ErrorText
          text="An error occurred while fetching the installations. You can try
          searching again."
          error={error}
        />
      )}
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
    const installationDetailLink = `/installations/${installation.orderNumber}`;
    return (
      <Tr>
        <Td>
          <TdText>
            <span title={installation.orderNumber || ""}>
              <Link to={installationDetailLink}>
                {installation.orderNumber}
              </Link>
            </span>
          </TdText>
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
          <Link to={installationDetailLink}>
            <ButtonLink>Details</ButtonLink>
          </Link>
        </Td>
      </Tr>
    );
  }
}
