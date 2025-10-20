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
import {
  getInstallationTypeEmoji,
  getInstallationTypeLabel,
} from "../utils/installationTypeEmojiMapper";

export function InstallationList() {
  const [filters, setFilters] = React.useState<InstallationFilters>({});
  const { installations, isLoading, error, refetchInstallations } =
    useGetInstallationsList(
      false,
      filters.cicId,
      filters.orderNumber,
      filters.installationUuid,
      filters.zipCode,
      filters.houseNumber,
      filters.houseAddition,
    );

  const { paginatedItems, paginationRange, currentPage, changePage } =
    usePaginate({
      items: installations || [],
      pageSize: 50,
    });

  const noInstallationsFound = installations && installations.length === 0;

  const isDirty = filters.cicId || filters.orderNumber;
  const installationUuidPlaceholder = isDirty
    ? ""
    : "e.g. INS-f804fb98-664b-4c94-ba01-38579323b34c";
  const orderNumberPlaceholder = isDirty ? "" : "e.g. QUATT1513202";
  const cicIdPlaceholder = isDirty
    ? ""
    : "e.g. CIC-16762b7b-6977-4047-999e-5bf39226f7f5";

  const zipCodePlaceholder = isDirty ? "" : "e.g. 1111AB";
  const houseNumberPlaceholder = isDirty ? "" : "e.g. 123";
  const additionPlaceholder = isDirty ? "" : "e.g. 1";

  return (
    <div className={classes.page}>
      <div className={classes["page-title-container"]}>
        <h2 className={classes["page-title"]}>
          🛠️ Installations
          {!isDirty && (
            <span className={classes["instruction-text"]}>
              Search for an installation.
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
              <TdText>
                <span title="Installation Type">🏷️</span>
              </TdText>
            </Th>
            <Th>
              <TdText>Installation UUID</TdText>
            </Th>
            <Th>
              <TdText>Order number</TdText>
            </Th>
            <Th>
              <TdText>Zip code</TdText>
            </Th>
            <Th>
              <TdText>House number</TdText>
            </Th>
            <Th>
              <TdText>House addition</TdText>
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
            <Th></Th>
            <Th>
              <TextFilter
                filterKey="installationUuid"
                placeholder={installationUuidPlaceholder}
                setFilters={setFilters}
              />
            </Th>

            <Th>
              <TextFilter
                filterKey="orderNumber"
                placeholder={orderNumberPlaceholder}
                setFilters={setFilters}
              />
            </Th>

            <Th>
              <TextFilter
                filterKey="zipCode"
                placeholder={zipCodePlaceholder}
                setFilters={setFilters}
              />
            </Th>

            <Th>
              <TextFilter
                filterKey="houseNumber"
                placeholder={houseNumberPlaceholder}
                setFilters={setFilters}
              />
            </Th>

            <Th>
              <TextFilter
                filterKey="houseAddition"
                placeholder={additionPlaceholder}
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
          No installations found with the given parameters
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
    const installationDetailLink = `/installations/${installation.installationUuid}`;
    const cicDetailLink = `/cics/${installation.cicId}`;
    const emoji = getInstallationTypeEmoji(installation.installationType);
    const typeLabel = getInstallationTypeLabel(installation.installationType);
    return (
      <Tr>
        <Td>
          <TdText>
            <span
              className={classes["installation-type-emoji"]}
              title={typeLabel}
            >
              {emoji}
            </span>
          </TdText>
        </Td>
        <Td>
          <Link to={installationDetailLink}>
            {installation.installationUuid}
          </Link>
        </Td>

        <Td>
          <Link to={installationDetailLink}>{installation.orderNumber}</Link>
        </Td>

        <Td>
          <TdText>{installation.zipCode}</TdText>
        </Td>

        <Td>
          <TdText>{installation.houseNumber}</TdText>
        </Td>

        <Td>
          <TdText>{installation.houseAddition}</TdText>
        </Td>

        <Td>
          <Link to={cicDetailLink}>{installation.cicId}</Link>
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
