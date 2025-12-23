import { DataTable } from "@/components/shared/DataTable";
import {
  InstallationFiltersComponent,
  installationColumns,
} from "./components";
import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import client from "@/openapi-client/client";
import {
  formatDateToYYYYMMDD,
  applyFilterPrefixAndValidation,
  validateMinLength,
} from "@/utils/filterUtils";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListPageLoadingState } from "@/components/shared/ListPageLoadingState";
import { ListPageErrorState } from "@/components/shared/ListPageErrorState";
import { ListPageEmptyState } from "@/components/shared/ListPageEmptyState";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { useInstallationListState } from "./hooks/useInstallationListState";

export function InstallationListPage() {
  const {
    filters,
    pagination,
    setFilters,
    goToPage,
    nextPage,
    previousPage,
    hasActiveFilters,
  } = useInstallationListState();

  // Build API query parameters with prefix logic and validation
  const queryParams = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    // Apply auto-prefixing and minimum character requirements
    cicId: applyFilterPrefixAndValidation(filters.cicId, "CIC-", 3),
    orderNumber: applyFilterPrefixAndValidation(
      filters.orderNumber,
      "QUATT",
      3,
    ),
    installationUuid: validateMinLength(filters.installationUuid, 3),
    installationType: filters.installationType,
    // Address filters with minimum character requirements
    zipCode: validateMinLength(filters.zipCode, 3),
    houseNumber: validateMinLength(filters.houseNumber, 1),
    houseAddition: validateMinLength(filters.houseAddition, 1),
    houseId: validateMinLength(filters.houseId, 3),
    // Format dates to YYYY-MM-DD
    createdAtStart: formatDateToYYYYMMDD(filters.minCreatedAt),
    createdAtEnd: formatDateToYYYYMMDD(filters.maxCreatedAt),
    updatedAtStart: formatDateToYYYYMMDD(filters.minUpdatedAt),
    updatedAtEnd: formatDateToYYYYMMDD(filters.maxUpdatedAt),
  };

  // Use openapi-react-query client
  const { data, isLoading, error, refetch } = client.useQuery(
    "get",
    "/admin/installations",
    {
      params: {
        query: queryParams,
      },
    },
  );

  const installations = data?.result?.installations || [];
  const total = data?.result?.total || 0;
  const totalPages = Math.ceil(total / pagination.pageSize) || 1;
  const currentPage = pagination.page;

  if (error) {
    return (
      <ListPageErrorState
        entityName="Installations"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      className="container mx-auto space-y-6 p-6"
    >
      <PageHeader
        title="Installations"
        subtitle={`${total} installations found`}
        isLoading={isLoading}
      />

      <InstallationFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
      />

      {isLoading ? (
        <ListPageLoadingState entityName="installations" />
      ) : (
        <>
          <DataTable columns={installationColumns} data={installations} />

          {installations.length === 0 && (
            <ListPageEmptyState
              entityName="installations"
              hasFilters={hasActiveFilters}
            />
          )}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            pageSize={pagination.pageSize}
            onPreviousPage={previousPage}
            onNextPage={nextPage}
            onPageChange={goToPage}
          />
        </>
      )}
    </motion.div>
  );
}
