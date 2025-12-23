import type { components } from "@/openapi-client/types/api/v1";
import { createEnumMeta } from "./helpers";

export const ConnectionStatus = createEnumMeta<
  NonNullable<components["schemas"]["ConnectionStatus"]>
>({
  connected: { label: "Connected" },
  connecting: { label: "Connecting" },
  not_reachable: { label: "Not Reachable" },
  disconnected: { label: "Disconnected" },
  bad_credentials: { label: "Bad Credentials" },
});

export const CicHealthCheckStatus = createEnumMeta<
  components["schemas"]["CicHealthCheckStatus"]
>({
  correct: { label: "Correct" },
  warning: { label: "Warning" },
  error: { label: "Error" },
  notApplicable: { label: "Not Applicable" },
});
