import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export interface CICFilters {
  id?: string;
  orderNumber?: string;
  minCreatedAt?: string;
  maxCreatedAt?: string;
}

interface CICFiltersProps {
  filters: CICFilters;
  onFiltersChange: (filters: CICFilters) => void;
  onClearAll: () => void;
}

export function CICFiltersComponent({
  filters,
  onFiltersChange,
  onClearAll,
}: CICFiltersProps) {
  // Local state for debounced text inputs
  const [idInput, setIdInput] = useState(filters.id || "");
  const [orderNumberInput, setOrderNumberInput] = useState(
    filters.orderNumber || "",
  );

  // Sync local state from props (for browser back/forward navigation)
  useEffect(() => {
    setIdInput(filters.id || "");
  }, [filters.id]);

  useEffect(() => {
    setOrderNumberInput(filters.orderNumber || "");
  }, [filters.orderNumber]);

  // Debounce effect for ID filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (idInput !== filters.id) {
        onFiltersChange({ ...filters, id: idInput || undefined });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [idInput]);

  // Debounce effect for Order Number filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderNumberInput !== filters.orderNumber) {
        onFiltersChange({
          ...filters,
          orderNumber: orderNumberInput || undefined,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [orderNumberInput]);

  const handleMinDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      minCreatedAt: value ? new Date(value).toISOString() : undefined,
    });
  };

  const handleMaxDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      maxCreatedAt: value ? new Date(value).toISOString() : undefined,
    });
  };

  const clearFilters = () => {
    setIdInput("");
    setOrderNumberInput("");
    onClearAll();
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-foreground p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="mr-1 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="id-filter">CIC ID</Label>
          <Input
            id="id-filter"
            placeholder="Filter by ID..."
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Order Number Filter */}
        <div className="space-y-2">
          <Label htmlFor="order-filter">Order Number</Label>
          <Input
            id="order-filter"
            placeholder="Filter by order..."
            value={orderNumberInput}
            onChange={(e) => setOrderNumberInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Created Date Min Filter */}
        <div className="space-y-2">
          <Label htmlFor="date-min">Created After</Label>
          <Input
            id="date-min"
            type="datetime-local"
            value={
              filters.minCreatedAt ? filters.minCreatedAt.slice(0, 16) : ""
            }
            onChange={handleMinDateChange}
            className="h-9"
          />
        </div>

        {/* Created Date Max Filter */}
        <div className="space-y-2">
          <Label htmlFor="date-max">Created Before</Label>
          <Input
            id="date-max"
            type="datetime-local"
            max={new Date().toISOString().slice(0, 16)}
            value={
              filters.maxCreatedAt ? filters.maxCreatedAt.slice(0, 16) : ""
            }
            onChange={handleMaxDateChange}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}
