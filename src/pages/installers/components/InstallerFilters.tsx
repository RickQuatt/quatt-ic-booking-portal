import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export interface InstallerFilters {
  code?: string;
  name?: string;
  phone?: string;
  isActive?: boolean | "all";
  minCreatedAt?: Date;
  maxCreatedAt?: Date;
}

interface InstallerFiltersProps {
  filters: InstallerFilters;
  onFiltersChange: (filters: InstallerFilters) => void;
  onClearAll: () => void;
}

export function InstallerFiltersComponent({
  filters,
  onFiltersChange,
  onClearAll,
}: InstallerFiltersProps) {
  // Local state for debounced text inputs
  const [codeInput, setCodeInput] = useState(filters.code || "");
  const [nameInput, setNameInput] = useState(filters.name || "");
  const [phoneInput, setPhoneInput] = useState(filters.phone || "");

  // Sync local state from props (for browser back/forward navigation)
  useEffect(() => {
    setCodeInput(filters.code || "");
  }, [filters.code]);

  useEffect(() => {
    setNameInput(filters.name || "");
  }, [filters.name]);

  useEffect(() => {
    setPhoneInput(filters.phone || "");
  }, [filters.phone]);

  // Debounce effect for Code filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (codeInput !== filters.code) {
        onFiltersChange({ ...filters, code: codeInput || undefined });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [codeInput]);

  // Debounce effect for Name filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameInput !== filters.name) {
        onFiltersChange({ ...filters, name: nameInput || undefined });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nameInput]);

  // Debounce effect for Phone filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phoneInput !== filters.phone) {
        onFiltersChange({ ...filters, phone: phoneInput || undefined });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [phoneInput]);

  const handleIsActiveChange = (value: string) => {
    onFiltersChange({
      ...filters,
      isActive: value === "all" ? undefined : value === "true",
    });
  };

  const handleMinCreatedDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      minCreatedAt: value ? new Date(value) : undefined,
    });
  };

  const handleMaxCreatedDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      maxCreatedAt: value ? new Date(value) : undefined,
    });
  };

  const clearFilters = () => {
    setCodeInput("");
    setNameInput("");
    setPhoneInput("");
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
        {/* Code Filter */}
        <div className="space-y-2">
          <Label htmlFor="code-filter">Code</Label>
          <Input
            id="code-filter"
            placeholder="e.g. ABCD-1234"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Name Filter */}
        <div className="space-y-2">
          <Label htmlFor="name-filter">Name</Label>
          <Input
            id="name-filter"
            placeholder="Filter by name..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Phone Filter */}
        <div className="space-y-2">
          <Label htmlFor="phone-filter">Phone</Label>
          <Input
            id="phone-filter"
            type="tel"
            placeholder="e.g. +31612345678"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Is Active Filter */}
        <div className="space-y-2">
          <Label htmlFor="active-filter">Is Active</Label>
          <Select
            value={
              filters.isActive === undefined
                ? "all"
                : filters.isActive
                  ? "true"
                  : "false"
            }
            onValueChange={handleIsActiveChange}
          >
            <SelectTrigger id="active-filter" className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Created After Filter */}
        <div className="space-y-2">
          <Label htmlFor="created-min">Created After</Label>
          <Input
            id="created-min"
            type="datetime-local"
            value={
              filters.minCreatedAt
                ? new Date(filters.minCreatedAt).toISOString().slice(0, 16)
                : ""
            }
            onChange={handleMinCreatedDateChange}
            className="h-9"
          />
        </div>

        {/* Created Before Filter */}
        <div className="space-y-2">
          <Label htmlFor="created-max">Created Before</Label>
          <Input
            id="created-max"
            type="datetime-local"
            max={new Date().toISOString().slice(0, 16)}
            value={
              filters.maxCreatedAt
                ? new Date(filters.maxCreatedAt).toISOString().slice(0, 16)
                : ""
            }
            onChange={handleMaxCreatedDateChange}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}
