import { DataTable } from "@/components/shared/DataTable";
import { cicColumns } from "./components/CicTableColumns";
import { CICFiltersComponent } from "./components/CICFilters";
import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { $api } from "@/openapi-client/context";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListPageLoadingState } from "@/components/shared/ListPageLoadingState";
import { ListPageErrorState } from "@/components/shared/ListPageErrorState";
import { ListPageEmptyState } from "@/components/shared/ListPageEmptyState";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { useCICListState } from "./hooks/useCICListState";

export function CICListPage() {
  const {
    filters,
    pagination,
    setFilters,
    goToPage,
    nextPage,
    previousPage,
    hasActiveFilters,
  } = useCICListState();

  const {
    data: results,
    isLoading,
    isError,
    error,
    refetch,
  } = $api.useQuery(
    "get",
    "/admin/cic/list",
    {
      params: {
        query: {
          cicId: filters.id || undefined,
          orderNumber: filters.orderNumber || undefined,
          page: pagination.page,
          pageSize: pagination.pageSize,
          createdAtEnd: filters.maxCreatedAt || undefined,
          createdAtStart: filters.minCreatedAt || undefined,
        },
      },
    },
    { refetchOnWindowFocus: false },
  );

  const cics = results?.result?.cics || [];
  const total = results?.result?.total || 0;
  const totalPages = results?.result?.totalPages || 1;
  const currentPage = pagination.page;

  if (isError) {
    return (
      <ListPageErrorState
        entityName="CICs"
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
        title="CIC List"
        subtitle={`${total} CICs found`}
        isLoading={isLoading}
      />

      <CICFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <ListPageLoadingState entityName="CICs" />
      ) : (
        <>
          <DataTable columns={cicColumns} data={cics} />

          {cics.length === 0 && (
            <ListPageEmptyState
              entityName="CICs"
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
