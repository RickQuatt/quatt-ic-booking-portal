import { $api } from "@/openapi-client/context";
import { toast } from "sonner";
import type { components } from "@/openapi-client/types/api/v1";

type BulkJobResponse = components["schemas"]["BulkJobResponse"];

export function useBulkJobSubmit(onSuccess: (data: BulkJobResponse) => void) {
  return $api.useMutation("post", "/admin/installation/bulkJobs", {
    onSuccess: (response) => {
      toast.success(`Bulk job created: ${response.result.bulkJobUuid}`);
      onSuccess(response);
    },
    onError: (error) => {
      // Handle API validation errors
      toast.error("Failed to create bulk job. Check console for details.");
      console.error("Bulk job submission error:", error);
    },
  });
}
