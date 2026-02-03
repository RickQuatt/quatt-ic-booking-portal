import { $api } from "@/openapi-client/context";
import { toast } from "sonner";
import type { components } from "@/openapi-client/types/api/v1";
import type { UseFormReset } from "react-hook-form";

type UpdateAdminInstallation = components["schemas"]["UpdateAdminInstallation"];

interface UseUpdateInstallationSettingsOptions {
  installationUuid: string;
  onSuccess?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reset?: UseFormReset<any>;
}

/**
 * Hook for updating installation settings
 * Used by both InstallationSettings and InstallationSettingsModal components
 */
export function useUpdateInstallationSettings({
  installationUuid,
  onSuccess,
  reset,
}: UseUpdateInstallationSettingsOptions) {
  const mutation = $api.useMutation(
    "put",
    "/admin/installation/{installationId}",
    {
      onSuccess: () => {
        toast.success("Settings updated successfully");
        reset?.({}, { keepValues: true });
        onSuccess?.();
      },
      onError: () => {
        toast.error("Failed to update settings");
      },
    },
  );

  const updateSettings = (data: UpdateAdminInstallation) => {
    mutation.mutate({
      params: { path: { installationId: installationUuid } },
      body: data,
    });
  };

  return {
    updateSettings,
    isPending: mutation.isPending,
  };
}
