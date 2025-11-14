import type { components } from "../../openapi-client/types/api/v1";

// Filter types aligned with new paginated API endpoint
// GET /admin/installations query parameters
export type InstallationFilters = {
  // Supported by new API
  cicId?: string;
  orderNumber?: string;
  installationUuid?: string;
  installationType?: components["schemas"]["DetailedInstallationType"];
  createdAtStart?: string; // YYYY-MM-DD format
  createdAtEnd?: string; // YYYY-MM-DD format
  updatedAtStart?: string; // YYYY-MM-DD format
  updatedAtEnd?: string; // YYYY-MM-DD format

  // Address filters
  zipCode?: string;
  houseNumber?: string;
  houseAddition?: string;
  houseId?: string;

  // Internal filter state (for UI, not sent to API)
  minCreatedAt?: Date | null;
  maxCreatedAt?: Date | null;
  minUpdatedAt?: Date | null;
  maxUpdatedAt?: Date | null;
};
