import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { X } from "lucide-react";

export interface VisitJobFilters {
  jobType?: string;
}

export interface VisitJobFiltersProps {
  availableJobTypes: string[];
  filters: VisitJobFilters;
  onFiltersChange: (filters: VisitJobFilters) => void;
  onClearAll: () => void;
  jobCount: number;
}

/**
 * VisitJobFilters - Filter UI for visit jobs page
 * Provides job type dropdown filter with clear functionality
 *
 * @example
 * ```tsx
 * <VisitJobFilters
 *   availableJobTypes={["Installation", "Maintenance", "Repair"]}
 *   filters={{ jobType: "Installation" }}
 *   onFiltersChange={setFilters}
 *   onClearAll={() => setFilters({})}
 *   jobCount={42}
 * />
 * ```
 */
export function VisitJobFilters({
  availableJobTypes,
  filters,
  onFiltersChange,
  onClearAll,
  jobCount,
}: VisitJobFiltersProps) {
  const handleJobTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      jobType: value === "all" ? undefined : value,
    });
  };

  const hasActiveFilters = !!filters.jobType;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-foreground p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Filters</h3>
          <Badge variant="outline" className="font-mono">
            {jobCount} {jobCount === 1 ? "job" : "jobs"}
          </Badge>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8"
          >
            <X className="mr-1 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Job Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="job-type-filter">Job Type</Label>
          <Select
            value={filters.jobType || "all"}
            onValueChange={handleJobTypeChange}
            disabled={availableJobTypes.length === 0}
          >
            <SelectTrigger id="job-type-filter" className="h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableJobTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
