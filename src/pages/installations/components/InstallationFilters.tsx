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
import { X, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getInstallationTypeIcons,
  getInstallationTypeLabel,
} from "@/utils/installationTypeEmojiMapper";
import type { components } from "@/openapi-client/types/api/v1";
import { DetailedInstallationType } from "@/constants/enums";

type DetailedInstallationTypeValue =
  components["schemas"]["DetailedInstallationType"];

export interface InstallationFilters {
  installationUuid?: string;
  orderNumber?: string;
  cicId?: string;
  installationType?: DetailedInstallationTypeValue;
  zipCode?: string;
  houseNumber?: string;
  houseAddition?: string;
  houseId?: string;
  minCreatedAt?: Date;
  maxCreatedAt?: Date;
  minUpdatedAt?: Date;
  maxUpdatedAt?: Date;
}

interface InstallationFiltersProps {
  filters: InstallationFilters;
  onFiltersChange: (filters: InstallationFilters) => void;
}

export function InstallationFiltersComponent({
  filters,
  onFiltersChange,
}: InstallationFiltersProps) {
  // Local state for debounced text inputs
  const [uuidInput, setUuidInput] = useState(filters.installationUuid || "");
  const [orderNumberInput, setOrderNumberInput] = useState(
    filters.orderNumber || "",
  );
  const [cicIdInput, setCicIdInput] = useState(filters.cicId || "");
  const [zipCodeInput, setZipCodeInput] = useState(filters.zipCode || "");
  const [houseNumberInput, setHouseNumberInput] = useState(
    filters.houseNumber || "",
  );
  const [houseAdditionInput, setHouseAdditionInput] = useState(
    filters.houseAddition || "",
  );
  const [houseIdInput, setHouseIdInput] = useState(filters.houseId || "");

  // Sync local state from props (for browser back/forward navigation)
  useEffect(() => {
    setUuidInput(filters.installationUuid || "");
  }, [filters.installationUuid]);

  useEffect(() => {
    setOrderNumberInput(filters.orderNumber || "");
  }, [filters.orderNumber]);

  useEffect(() => {
    setCicIdInput(filters.cicId || "");
  }, [filters.cicId]);

  useEffect(() => {
    setZipCodeInput(filters.zipCode || "");
  }, [filters.zipCode]);

  useEffect(() => {
    setHouseNumberInput(filters.houseNumber || "");
  }, [filters.houseNumber]);

  useEffect(() => {
    setHouseAdditionInput(filters.houseAddition || "");
  }, [filters.houseAddition]);

  useEffect(() => {
    setHouseIdInput(filters.houseId || "");
  }, [filters.houseId]);

  // Debounce effect for Installation UUID filter (min 3 chars)
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = uuidInput.trim();
      if (value.length >= 3 || value.length === 0) {
        if (value !== filters.installationUuid) {
          onFiltersChange({
            ...filters,
            installationUuid: value || undefined,
          });
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [uuidInput]);

  // Debounce effect for Order Number filter (min 3 chars, auto-prefix QUATT)
  useEffect(() => {
    const timer = setTimeout(() => {
      let value = orderNumberInput.trim();
      if (value.length >= 3) {
        if (!value.startsWith("QUATT")) {
          value = `QUATT${value}`;
        }
        if (value !== filters.orderNumber) {
          onFiltersChange({ ...filters, orderNumber: value });
        }
      } else if (value.length === 0 && filters.orderNumber) {
        onFiltersChange({ ...filters, orderNumber: undefined });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [orderNumberInput]);

  // Debounce effect for CIC ID filter (min 3 chars, auto-prefix CIC-)
  useEffect(() => {
    const timer = setTimeout(() => {
      let value = cicIdInput.trim();
      if (value.length >= 3) {
        if (!value.startsWith("CIC-")) {
          value = `CIC-${value}`;
        }
        if (value !== filters.cicId) {
          onFiltersChange({ ...filters, cicId: value });
        }
      } else if (value.length === 0 && filters.cicId) {
        onFiltersChange({ ...filters, cicId: undefined });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cicIdInput]);

  // Debounce effect for Zip Code filter (min 3 chars)
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = zipCodeInput.trim();
      if (value.length >= 3 || value.length === 0) {
        if (value !== filters.zipCode) {
          onFiltersChange({ ...filters, zipCode: value || undefined });
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [zipCodeInput]);

  // Debounce effect for House Number filter (min 1 char)
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = houseNumberInput.trim();
      if (value.length >= 1 || value.length === 0) {
        if (value !== filters.houseNumber) {
          onFiltersChange({ ...filters, houseNumber: value || undefined });
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [houseNumberInput]);

  // Debounce effect for House Addition filter (min 1 char)
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = houseAdditionInput.trim();
      if (value.length >= 1 || value.length === 0) {
        if (value !== filters.houseAddition) {
          onFiltersChange({ ...filters, houseAddition: value || undefined });
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [houseAdditionInput]);

  // Debounce effect for House ID filter (min 3 chars)
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = houseIdInput.trim();
      if (value.length >= 3 || value.length === 0) {
        if (value !== filters.houseId) {
          onFiltersChange({ ...filters, houseId: value || undefined });
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [houseIdInput]);

  const handleInstallationTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      installationType:
        value === "all"
          ? undefined
          : (value as NonNullable<DetailedInstallationTypeValue>),
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

  const handleMinUpdatedDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      minUpdatedAt: value ? new Date(value) : undefined,
    });
  };

  const handleMaxUpdatedDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      maxUpdatedAt: value ? new Date(value) : undefined,
    });
  };

  const clearFilters = () => {
    setUuidInput("");
    setOrderNumberInput("");
    setCicIdInput("");
    setZipCodeInput("");
    setHouseNumberInput("");
    setHouseAdditionInput("");
    setHouseIdInput("");
    onFiltersChange({});
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
        {/* Installation UUID Filter */}
        <div className="space-y-2">
          <Label htmlFor="uuid-filter">Installation UUID</Label>
          <Input
            id="uuid-filter"
            placeholder="e.g. INS-f804fb98..."
            value={uuidInput}
            onChange={(e) => setUuidInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Order Number Filter (auto-prefix QUATT) */}
        <div className="space-y-2">
          <Label htmlFor="order-filter">Order Number</Label>
          <Input
            id="order-filter"
            placeholder="e.g. 1513202 or QUATT1513202"
            value={orderNumberInput}
            onChange={(e) => setOrderNumberInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* CIC ID Filter (auto-prefix CIC-) */}
        <div className="space-y-2">
          <Label htmlFor="cic-filter">Active CIC</Label>
          <Input
            id="cic-filter"
            placeholder="e.g. 16762b7b or CIC-16762b7b..."
            value={cicIdInput}
            onChange={(e) => setCicIdInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Installation Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type-filter">Installation Type</Label>
          <Select
            value={filters.installationType || "all"}
            onValueChange={handleInstallationTypeChange}
          >
            <SelectTrigger id="type-filter" className="h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DetailedInstallationType.values.map((type) => {
                const icons = getInstallationTypeIcons(type);
                return (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-1">
                      {icons &&
                        (() => {
                          const {
                            showFire,
                            systemIcon: SystemIcon,
                            chillIcon: ChillIcon,
                            heatPumpCount,
                            heatPumpIcon: HeatPumpIcon,
                          } = icons;
                          return (
                            <>
                              {ChillIcon && (
                                <ChillIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                              )}
                              {showFire && (
                                <Flame className="h-3 w-3 text-orange-500" />
                              )}
                              {SystemIcon && (
                                <SystemIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                              )}
                              {HeatPumpIcon &&
                                Array.from({ length: heatPumpCount }).map(
                                  (_, i) => (
                                    <HeatPumpIcon
                                      key={i}
                                      className="h-4 w-4 text-gray-700 dark:text-gray-300"
                                    />
                                  ),
                                )}
                            </>
                          );
                        })()}
                      <span className="ml-1">
                        {getInstallationTypeLabel(type)}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Zip Code Filter */}
        <div className="space-y-2">
          <Label htmlFor="zip-filter">Zip Code</Label>
          <Input
            id="zip-filter"
            placeholder="e.g. 1111AB"
            value={zipCodeInput}
            onChange={(e) => setZipCodeInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* House Number Filter */}
        <div className="space-y-2">
          <Label htmlFor="house-number-filter">House Number</Label>
          <Input
            id="house-number-filter"
            placeholder="e.g. 123"
            value={houseNumberInput}
            onChange={(e) => setHouseNumberInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* House Addition Filter */}
        <div className="space-y-2">
          <Label htmlFor="house-addition-filter">House Addition</Label>
          <Input
            id="house-addition-filter"
            placeholder="e.g. A"
            value={houseAdditionInput}
            onChange={(e) => setHouseAdditionInput(e.target.value)}
            className="h-9"
          />
        </div>

        {/* House ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="house-id-filter">House ID</Label>
          <Input
            id="house-id-filter"
            placeholder="e.g. 12345"
            value={houseIdInput}
            onChange={(e) => setHouseIdInput(e.target.value)}
            className="h-9"
          />
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

        {/* Updated After Filter */}
        <div className="space-y-2">
          <Label htmlFor="updated-min">Updated After</Label>
          <Input
            id="updated-min"
            type="datetime-local"
            value={
              filters.minUpdatedAt
                ? new Date(filters.minUpdatedAt).toISOString().slice(0, 16)
                : ""
            }
            onChange={handleMinUpdatedDateChange}
            className="h-9"
          />
        </div>

        {/* Updated Before Filter */}
        <div className="space-y-2">
          <Label htmlFor="updated-max">Updated Before</Label>
          <Input
            id="updated-max"
            type="datetime-local"
            max={new Date().toISOString().slice(0, 16)}
            value={
              filters.maxUpdatedAt
                ? new Date(filters.maxUpdatedAt).toISOString().slice(0, 16)
                : ""
            }
            onChange={handleMaxUpdatedDateChange}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}
