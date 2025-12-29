import { useMemo, useCallback } from "react";
import { DataTable } from "@/components/shared/DataTable";
import {
  InstallerFiltersComponent,
  createInstallerColumns,
  InstallerFilters,
  InstallerModal,
  useInstallerModalState,
} from "./components";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { $api } from "@/openapi-client/context";
import { toast } from "sonner";
import type { components } from "@/openapi-client/types/api/v1";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListPageLoadingState } from "@/components/shared/ListPageLoadingState";
import { ListPageErrorState } from "@/components/shared/ListPageErrorState";
import { ListPageEmptyState } from "@/components/shared/ListPageEmptyState";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { useInstallerListState } from "./hooks/useInstallerListState";

type Installer = components["schemas"]["Installer"];

// Client-side filtering logic
function filterInstallers(
  installers: Installer[],
  filters: InstallerFilters,
): Installer[] {
  return installers.filter((installer) => {
    // Code filter
    if (filters.code) {
      if (!installer.code.toLowerCase().includes(filters.code.toLowerCase())) {
        return false;
      }
    }

    // Name filter
    if (filters.name) {
      if (!installer.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
    }

    // Phone filter
    if (filters.phone) {
      if (
        !installer.phone.toLowerCase().includes(filters.phone.toLowerCase())
      ) {
        return false;
      }
    }

    // Is Active filter
    if (filters.isActive !== undefined && filters.isActive !== "all") {
      if (installer.isActive !== filters.isActive) {
        return false;
      }
    }

    // Created After filter
    if (filters.minCreatedAt) {
      if (new Date(installer.createdAt) < new Date(filters.minCreatedAt)) {
        return false;
      }
    }

    // Created Before filter
    if (filters.maxCreatedAt) {
      if (new Date(installer.createdAt) > new Date(filters.maxCreatedAt)) {
        return false;
      }
    }

    return true;
  });
}

export function InstallerListPage() {
  const {
    filters,
    pagination,
    setFilters,
    clearAll,
    goToPage,
    nextPage,
    previousPage,
    hasActiveFilters,
  } = useInstallerListState();

  const {
    isOpen: isInstallerModalOpen,
    open: openInstallerModal,
    close: closeInstallerModal,
    installerId,
    data: installerData,
  } = useInstallerModalState();

  const { data, isLoading, isError, error, refetch } = $api.useQuery(
    "get",
    "/admin/installer/list",
    {},
    { refetchOnWindowFocus: false },
  );

  const deleteInstallerMutation = $api.useMutation(
    "delete",
    "/admin/installer/{installerId}",
    {
      onSuccess: () => {
        toast.success("Installer deleted successfully");
        refetch();
      },
      onError: () => {
        toast.error("Failed to delete installer");
      },
    },
  );

  // Apply client-side filtering
  const filteredInstallers = useMemo(() => {
    const allInstallers = data?.result || [];
    return filterInstallers(allInstallers, filters);
  }, [data?.result, filters]);

  // Apply client-side pagination
  const total = filteredInstallers.length;
  const totalPages = Math.ceil(total / pagination.pageSize) || 1;
  const currentPage = pagination.page;

  const installers = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredInstallers.slice(start, end);
  }, [filteredInstallers, pagination.page, pagination.pageSize]);

  const handleDelete = useCallback(
    (installerId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this installer?",
      );
      if (!confirmed) return;

      deleteInstallerMutation.mutate({
        params: { path: { installerId } },
      });
    },
    [deleteInstallerMutation],
  );

  const columns = useMemo(
    () =>
      createInstallerColumns({
        onEdit: (installer) =>
          openInstallerModal({ installerId: installer.id, data: installer }),
        onDelete: handleDelete,
      }),
    [openInstallerModal, handleDelete],
  );

  // Generate subtitle based on filter state
  const getSubtitle = () => {
    const suffix = total !== 1 ? "s" : "";
    if (hasActiveFilters) {
      return `${total} installer${suffix} found`;
    }
    return `${total} installer${suffix} total`;
  };

  if (isError) {
    return (
      <ListPageErrorState
        entityName="Installers"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <InstallerModal
        isOpen={isInstallerModalOpen}
        closeModal={closeInstallerModal}
        installerId={installerId}
        installerData={installerData}
        onSuccess={refetch}
      />

      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="animate"
        className="container mx-auto space-y-6 p-6"
      >
        <PageHeader
          title="Installers"
          subtitle={getSubtitle()}
          isLoading={isLoading}
          actions={
            <Button onClick={() => openInstallerModal()} size="default">
              <Plus className="h-4 w-4" />
              Add Installer
            </Button>
          }
        />

        <InstallerFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onClearAll={clearAll}
        />

        {isLoading ? (
          <ListPageLoadingState entityName="installers" />
        ) : (
          <>
            <DataTable columns={columns} data={installers} />

            {installers.length === 0 && (
              <ListPageEmptyState
                entityName="installers"
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
    </>
  );
}
