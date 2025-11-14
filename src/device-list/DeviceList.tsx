import {
  TBody,
  THead,
  Table,
  Td,
  TdText,
  Th,
  Tr,
} from "../ui-components/table/Table";
import classes from "./DeviceList.module.css";
import { formatDate } from "../utils/formatDate";
import { Link } from "wouter";
import React from "react";
import { DeviceFilters, DeviceItem } from "./filters/types";
import { usePaginate } from "../ui-components/pagination/usePaginate";
import {
  CreatedAtFilter,
  UpdatedAtFilter,
  DeviceTypeFilter,
  DeviceUuidFilter,
  InstallationUuidFilter,
  CicIdFilter,
  SerialNumberFilter,
  NameFilter,
  DeviceStatusFilter,
  Eui64Filter,
  DongleRoleFilter,
  PcbHwVersionFilter,
  HeatBatterySizeFilter,
} from "./filters/Filters";
import { Pagination } from "../ui-components/pagination/Pagination";
import { Loader } from "../ui-components/loader/Loader";
import ErrorText from "../ui-components/error-text/ErrorText";
import client from "../openapi-client/client";
import { validateMinLength } from "./utils/filterUtils";
import { Button } from "../ui-components/button/Button";
import { components } from "../openapi-client/types/api/v1";

export function DeviceList() {
  const [filters, setFilters] = React.useState<DeviceFilters>({});
  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 20, // Default 20 per page as per requirements
  });

  // Build API query parameters with validation
  const queryParams = React.useMemo(() => {
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      type: filters.type,
      // Apply minimum character requirements (3 characters)
      deviceUuid: validateMinLength(filters.deviceUuid, 3),
      installationUuid: validateMinLength(filters.installationUuid, 3),
      cicId: validateMinLength(filters.cicId, 3),
      serialNumber: validateMinLength(filters.serialNumber, 3),
      name: validateMinLength(filters.name, 2),
      status: filters.status,
      eui64: validateMinLength(filters.eui64, 3),
      createdAtStart:
        filters.minCreatedAt?.toISOString().split("T")[0] ?? undefined,
      createdAtEnd:
        filters.maxCreatedAt?.toISOString().split("T")[0] ?? undefined,
      updatedAtStart:
        filters.minUpdatedAt?.toISOString().split("T")[0] ?? undefined,
      updatedAtEnd:
        filters.maxUpdatedAt?.toISOString().split("T")[0] ?? undefined,
      // Conditional filters
      role: filters.role,
      pcbHwVersion: filters.pcbHwVersion,
      heatBatterySize: filters.heatBatterySize,
    };
  }, [filters, pagination]);

  // Use openapi-react-query client
  const { data, isLoading, error } = client.useQuery("get", "/admin/devices", {
    params: {
      query: queryParams,
    },
  });

  const devices = data?.result?.devices || [];
  const total = data?.result?.total || 0;
  const totalPages = data?.result?.totalPages || 0;

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filters]);

  // Client-side pagination for UI (using server-paginated data)
  const { paginationRange, currentPage, changePage } = usePaginate({
    items: devices,
    pageSize: pagination.pageSize,
    total: total,
  });

  const noDevicesFound = React.useMemo(() => {
    return !isLoading && devices.length === 0;
  }, [isLoading, devices.length]);

  // Check if any filters are applied
  const hasFilters = React.useMemo(() => {
    return Object.keys(filters).some((key) => {
      const value = filters[key as keyof DeviceFilters];
      return value !== undefined && value !== null && value !== "";
    });
  }, [filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  // Show conditional filters based on device type
  const showDongleFilters = filters.type === "DONGLE";
  const showHeatBatteryFilters = filters.type === "HEAT_BATTERY";

  // Check for filter validation errors (400 errors)
  const isFilterError = error && "status" in error && error.status === 400;

  return (
    <div className={classes.page}>
      <div className={classes["page-title-container"]}>
        <h2 className={classes["page-title"]}>
          🔧 Devices
          {!hasFilters && (
            <span className={classes["instruction-text"]}>
              Use filters to search for devices.
            </span>
          )}
        </h2>
        <div className={classes["header-actions"]}>
          {hasFilters && <Button onClick={clearFilters}>Clear Filters</Button>}
          {isLoading && (
            <div className={classes["loader-container"]}>
              <Loader />
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && devices.length > 0 && (
        <div className={classes["results-info"]}>
          Showing {(currentPage - 1) * pagination.pageSize + 1}-
          {Math.min(currentPage * pagination.pageSize, total)} of {total}{" "}
          results
        </div>
      )}

      <Table gridClass={classes["table-grid"]}>
        <THead>
          <Tr>
            <Th>
              <TdText>Type</TdText>
            </Th>
            <Th>
              <TdText>Device UUID</TdText>
            </Th>
            <Th>
              <TdText>Name</TdText>
            </Th>
            <Th>
              <TdText>Status</TdText>
            </Th>
            <Th>
              <TdText>Serial #</TdText>
            </Th>
            <Th>
              <TdText>EUI64</TdText>
            </Th>
            <Th>
              <TdText>Installation</TdText>
            </Th>
            <Th>
              <TdText>CIC ID</TdText>
            </Th>
            <Th>
              <TdText>Created</TdText>
            </Th>
            <Th>
              <TdText>Updated</TdText>
            </Th>
          </Tr>
          {/* Filter row */}
          <Tr>
            <Th>
              <DeviceTypeFilter setFilters={setFilters} />
            </Th>
            <Th>
              <DeviceUuidFilter setFilters={setFilters} />
            </Th>
            <Th>
              <NameFilter setFilters={setFilters} />
            </Th>
            <Th>
              <DeviceStatusFilter setFilters={setFilters} />
            </Th>
            <Th>
              <SerialNumberFilter setFilters={setFilters} />
            </Th>
            <Th>
              <Eui64Filter setFilters={setFilters} />
            </Th>
            <Th>
              <InstallationUuidFilter setFilters={setFilters} />
            </Th>
            <Th>
              <CicIdFilter setFilters={setFilters} />
            </Th>
            <Th>
              <CreatedAtFilter setFilters={setFilters} filters={filters} />
            </Th>
            <Th>
              <UpdatedAtFilter setFilters={setFilters} filters={filters} />
            </Th>
          </Tr>
          {/* Conditional filter row for device-specific fields */}
          {(showDongleFilters || showHeatBatteryFilters) && (
            <Tr>
              <Th>
                <TdText></TdText>
              </Th>
              <Th>
                <TdText></TdText>
              </Th>
              <Th>
                <TdText></TdText>
              </Th>
              <Th>
                <TdText></TdText>
              </Th>
              <Th>
                {showDongleFilters && (
                  <DongleRoleFilter setFilters={setFilters} />
                )}
                {showHeatBatteryFilters && (
                  <HeatBatterySizeFilter setFilters={setFilters} />
                )}
              </Th>
              <Th>
                {showDongleFilters && (
                  <PcbHwVersionFilter setFilters={setFilters} />
                )}
              </Th>
              <Th>
                <TdText></TdText>
              </Th>
              <Th>
                <TdText></TdText>
              </Th>
              <Th>
                <TdText></TdText>
              </Th>
              <Th>
                <TdText></TdText>
              </Th>
            </Tr>
          )}
        </THead>
        <TBody>
          {devices.map((device, index) => (
            <DeviceRow key={device.deviceUuid || index} device={device} />
          ))}
        </TBody>
      </Table>

      {noDevicesFound && !isFilterError && (
        <div className={classes["empty-state"]}>
          <p className={classes["info-text"]}>
            {hasFilters
              ? "No devices found with the given filters. Try adjusting your search criteria."
              : "No devices found. Use filters above to search for devices."}
          </p>
        </div>
      )}

      {isFilterError && (
        <ErrorText
          text="Invalid filter combination. Please check your filters."
          error={error}
        />
      )}

      {!!error && !isFilterError && (
        <ErrorText
          text="An error occurred while fetching devices."
          error={error}
        />
      )}

      <div className={classes["pagination-container"]}>
        <Pagination
          paginationRange={paginationRange}
          currentPage={currentPage}
          changePage={(page) => {
            changePage(page);
            setPagination((prev) => ({ ...prev, page }));
          }}
        />
      </div>
    </div>
  );
}

const statusClassMap: {
  [key in components["schemas"]["DeviceStatus"]]: string;
} = {
  ACTIVE: classes["status-active"],
  UNINSTALLED: classes["status-uninstalled"],
  PENDING_COMMISSIONING: classes["status-pending"],
  FACTORY: classes["status-factory"],
  IN_ERROR: classes["status-error"],
};

function DeviceRow({ device }: { device: DeviceItem }) {
  const installationDetailLink = device.installationUuid
    ? `/installations/${device.installationUuid}`
    : null;
  const cicDetailLink = device.cicId ? `/cics/${device.cicId}` : null;

  // Format device type for display
  const typeDisplay = device.type.replace(/_/g, " ");

  // Get status badge color
  const getStatusClass = (status?: string) => {
    if (!status || !(status in statusClassMap))
      return classes["status-default"];
    return statusClassMap[status as components["schemas"]["DeviceStatus"]];
  };

  return (
    <Tr>
      <Td>
        <TdText>{typeDisplay}</TdText>
      </Td>
      <Td>
        <TdText>{device.deviceUuid}</TdText>
      </Td>
      <Td>
        <TdText>{device.name || "—"}</TdText>
      </Td>
      <Td>
        <span
          className={`${classes["status-badge"]} ${getStatusClass(device.status)}`}
        >
          {device.status?.replace(/_/g, " ") || "—"}
        </span>
      </Td>
      <Td>
        <TdText>{device.serialNumber || "—"}</TdText>
      </Td>
      <Td>
        <TdText>{device.eui64 || "—"}</TdText>
      </Td>
      <Td>
        {installationDetailLink ? (
          <Link to={installationDetailLink}>{device.installationUuid}</Link>
        ) : (
          <TdText>—</TdText>
        )}
      </Td>
      <Td>
        {cicDetailLink ? (
          <Link to={cicDetailLink}>{device.cicId}</Link>
        ) : (
          <TdText>—</TdText>
        )}
      </Td>
      <Td>
        <TdText>
          {device.createdAt ? formatDate(new Date(device.createdAt)) : "—"}
        </TdText>
      </Td>
      <Td>
        <TdText>
          {device.updatedAt ? formatDate(new Date(device.updatedAt)) : "—"}
        </TdText>
      </Td>
    </Tr>
  );
}
