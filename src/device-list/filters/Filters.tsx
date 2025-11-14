import { DateRangeFilter } from "../../ui-components/filter/DateRangeFilter";
import { TextFilter } from "../../ui-components/filter/TextFilter";
import { SelectFilter } from "../../ui-components/filter/SelectFilter";
import { DeviceFilters } from "./types";
import { components } from "../../openapi-client/types/api/v1";

type SetFiltersFunc = (
  setFiltersFunc: (oldFilters: DeviceFilters) => DeviceFilters,
) => void;
type FilterProps = { setFilters: SetFiltersFunc; filters?: DeviceFilters };

// Common filters (always visible)

export function DeviceTypeFilter({ setFilters }: FilterProps) {
  const deviceTypes: {
    [key in components["schemas"]["DeviceType"]]: string;
  } = {
    DONGLE: "Dongle",
    CHILL: "Chill",
    HEAT_BATTERY: "Heat Battery",
    OUTDOOR_UNIT: "Outdoor Unit",
    HEAT_CHARGER: "Heat Charger",
    THERMOSTAT: "Thermostat",
    FLOW_TEMPERATURE_SENSOR: "Flow Temperature Sensor",
    HOME_BATTERY: "Home Battery",
    BOILER: "Boiler",
  };

  return (
    <SelectFilter setFilters={setFilters} filterKey="type">
      <option value="">All Types</option>
      {Object.entries(deviceTypes).map(([type, label]) => (
        <option key={type} value={type}>
          {label}
        </option>
      ))}
    </SelectFilter>
  );
}

export function DeviceUuidFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"deviceUuid"} />;
}

export function InstallationUuidFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"installationUuid"} />;
}

export function CicIdFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"cicId"} />;
}

export function SerialNumberFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"serialNumber"} />;
}

export function NameFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"name"} />;
}

export function DeviceStatusFilter({ setFilters }: FilterProps) {
  const statuses: {
    [key in components["schemas"]["DeviceStatus"]]: string;
  } = {
    ACTIVE: "Active",
    UNINSTALLED: "Uninstalled",
    PENDING_COMMISSIONING: "Pending Commissioning",
    FACTORY: "Factory",
    IN_ERROR: "In Error",
  };

  return (
    <SelectFilter setFilters={setFilters} filterKey="status">
      <option value="">All Statuses</option>
      {Object.entries(statuses).map(([status, label]) => (
        <option key={status} value={status}>
          {label}
        </option>
      ))}
    </SelectFilter>
  );
}

export function Eui64Filter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"eui64"} />;
}

export function CreatedAtFilter({ setFilters, filters }: FilterProps) {
  return (
    <DateRangeFilter
      setFilters={setFilters}
      minFilterKey="minCreatedAt"
      maxFilterKey="maxCreatedAt"
      filters={filters}
    />
  );
}

export function UpdatedAtFilter({ setFilters, filters }: FilterProps) {
  return (
    <DateRangeFilter
      setFilters={setFilters}
      minFilterKey="minUpdatedAt"
      maxFilterKey="maxUpdatedAt"
      filters={filters}
    />
  );
}

// Conditional filters (shown only when specific device type is selected)

export function DongleRoleFilter({ setFilters }: FilterProps) {
  const roles: {
    [key in components["schemas"]["DongleRole"]]: string;
  } = {
    RCP: "RCP",
    EXTENDER: "Extender",
  };

  return (
    <SelectFilter setFilters={setFilters} filterKey="role">
      <option value="">All Roles</option>
      {Object.entries(roles).map(([role, label]) => (
        <option key={role} value={role}>
          {label}
        </option>
      ))}
    </SelectFilter>
  );
}

export function PcbHwVersionFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"pcbHwVersion"} />;
}

export function HeatBatterySizeFilter({ setFilters }: FilterProps) {
  const sizes: {
    [key in components["schemas"]["HeatBatterySize"]]: string;
  } = {
    medium: "Medium",
    large: "Large",
    extra_large: "Extra Large",
  };

  return (
    <SelectFilter setFilters={setFilters} filterKey="heatBatterySize">
      <option value="">All Sizes</option>
      {Object.entries(sizes).map(([size, label]) => (
        <option key={size} value={size}>
          {label}
        </option>
      ))}
    </SelectFilter>
  );
}
