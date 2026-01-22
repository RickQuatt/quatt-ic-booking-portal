import type { components } from "@/openapi-client/types/api/v1";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

type BulkJobResponse = components["schemas"]["BulkJobResponse"];

interface BulkJobSuccessCardProps {
  data: BulkJobResponse;
}

export function BulkJobSuccessCard({ data }: BulkJobSuccessCardProps) {
  const { bulkJobUuid, jobsCreated, hoursToProcess, skipped } = data.result;

  return (
    <Card className="mt-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
      <CardHeader>
        <CardTitle className="text-green-900 dark:text-green-100">
          ✓ Bulk Job Created
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* UUID with copy button */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bulk Job UUID
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-gray-800">
              {bulkJobUuid}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(bulkJobUuid);
                toast.success("UUID copied to clipboard");
              }}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Jobs Created
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {jobsCreated}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Hours to Process
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {hoursToProcess}
            </div>
          </div>
        </div>

        {/* Skipped installations */}
        {skipped && skipped.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
              ⚠️ Skipped Installations ({skipped.length})
            </h4>
            <div className="space-y-2">
              {skipped.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded border border-amber-200 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950"
                >
                  <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                    {item.installationId}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
