import type { components } from "@/openapi-client/types/api/v1";
import { createEnumMeta } from "./helpers";

export const DetailedInstallationType = createEnumMeta<
  NonNullable<components["schemas"]["DetailedInstallationType"]>
>({
  HYBRID_SINGLE: { label: "Hybrid Single" },
  HYBRID_DUO: { label: "Hybrid Duo" },
  ALL_ELECTRIC_SINGLE: { label: "All Electric Single" },
  ALL_ELECTRIC_DUO: { label: "All Electric Duo" },
  CHILL_HYBRID_SINGLE: { label: "Chill Hybrid Single" },
  CHILL_HYBRID_DUO: { label: "Chill Hybrid Duo" },
  CHILL_ALL_ELECTRIC_SINGLE: { label: "Chill All Electric Single" },
  CHILL_ALL_ELECTRIC_DUO: { label: "Chill All Electric Duo" },
  HOME_BATTERY: { label: "Home Battery" },
});
