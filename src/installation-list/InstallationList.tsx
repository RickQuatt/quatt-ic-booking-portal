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
  const { installations, isLoading, error, refetchInstallations } =
    useGetInstallationsList(false, filters.cicId, filters.orderNumber);

  const { paginatedItems, paginationRange, currentPage, changePage } =
    usePaginate({
      items: installations || [],
      pageSize: 50,
    });

  const noInstallationsFound = installations && installations.length === 0;

  const isDirty = filters.cicId || filters.orderNumber;
  const orderNumberPlaceholder = isDirty
    ? ""
    : "Enter an order number wildcard";
  const cicIdPlaceholder = isDirty ? "" : "or a CIC id wildcard";

  return (
    <div className={classes.page}>
      <div className={classes["page-title-container"]}>
        <h2 className={classes["page-title"]}>
          🛠️ Installations
          {!isDirty && (
            <span className={classes["instruction-text"]}>
              Search with an order number or a CIC id (Now supports wildcard
              search!)
            </span>
          )}
        </h2>
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
          </Tr>
          <Tr>
            <Th>
              <TextFilter
                filterKey="orderNumber"
                placeholder={orderNumberPlaceholder}
                setFilters={setFilters}
              />
            </Th>
            <Th>
              <TextFilter
                filterKey="cicId"
                placeholder={cicIdPlaceholder}
                setFilters={setFilters}
              />
            </Th>
            <Th>
              <CreatedAtFilter setFilters={setFilters} />
            </Th>
            <Th>
              <UpdatedAtFilter setFilters={setFilters} />
            </Th>
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
          text="An error occurred while fetching the installations."
          error={error}
          retry={refetchInstallations}
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
          <Link to={installationDetailLink}>{installation.orderNumber}</Link>
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
      </Tr>
    );
  }
}
