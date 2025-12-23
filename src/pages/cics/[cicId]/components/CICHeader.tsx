import { Link } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { StickyHeader } from "@/components/shared/DetailPage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink, ClipboardCopy } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatDateDistance } from "@/utils/formatDate";
import {
  getGrafanaAllEDashboardLink,
  getGrafanaDataPerCICLink,
  getHubspotSearchOrderLink,
  getMenderLink,
} from "@/constants/externalLinks";

const supervisoryControlModeLabels: Record<number, string> = {
  0: "None",
  1: "Standby",
  2: "Heating HP Only",
  3: "Heating HP + Boiler",
  4: "Heating Boiler Only",
  95: "Sticky Pump Protection",
  96: "Anti-Freeze (Boiler On)",
  97: "Anti-Freeze (Boiler Pre-Pump)",
  98: "Anti-Freeze (Water Circulation)",
  100: "Ready",
  101: "Deaeration CH Test",
  102: "Flowrate OU1 Test",
  111: "Flowrate OU2 Test",
  112: "Flowrate All OU Test",
  113: "Flowrate Heat Charger Test",
  114: "Flowrate All OU + HC Test",
  108: "Boiler Test Pre-Pump",
  109: "Boiler Test",
  110: "Boiler Test Post-Pump",
  103: "Power OU Test Pre-Pump",
  106: "Power OU Test",
  107: "Power OU Test Post-Pump",
  115: "Power HC Test Pre-Pump",
  116: "Power HC Test",
  117: "Power HC Test Post-Pump",
  104: "Power All OU Test Pre-Heat",
  118: "Deaeration DHW Test",
  119: "Charging HC Test Pre-Pump",
  120: "Charging HC Test",
  121: "Charging HC Test Post-Pump",
  122: "Charging Boost HC Test Pre-Pump",
  123: "Charging Boost HC Test",
  124: "Charging Boost HC Test Post-Pump",
  125: "Charging Boost E HC Test Pre-Pump",
  126: "Charging Boost E HC Test",
  127: "Charging Boost E HC Test Post-Pump",
  128: "Discharging HC Test Pre-Pump",
  129: "Discharging HC Test",
  130: "Discharging HC Test Post-Pump",
  131: "CH Pre-Heat HC",
  140: "Chill Deaeration Flow",
  141: "Chill Deaeration Solenoid",
  142: "Chill Flowrate",
  143: "Chill Pre-Cooling CH",
  144: "Chill Cooling Commissioning",
  145: "Chill Cooling Post-Pump",
  400: "Not Configured",
};

function getSupervisoryControlModeLabel(
  mode: number | null | undefined,
): string {
  if (mode === undefined || mode === null) return "Unknown";
  return supervisoryControlModeLabels[mode] || String(mode);
}

type AdminCic = components["schemas"]["AdminCic"];

export interface CICHeaderProps {
  cicData: AdminCic;
  onRebootCIC: () => void;
  onForgetWifi: () => void;
  onStartLiveView: () => void;
  onCancelCommissioning: () => void;
  onForceCommissioning: () => void;
  isLoading?: boolean;
}

/**
 * Sticky header for CIC detail page
 * Contains CIC ID, status, last update, and quick link to external resources
 * Action buttons are now in the sidebar for better organization
 */
export function CICHeader({
  cicData,
  isLoading = false,
}: Omit<
  CICHeaderProps,
  | "onRebootCIC"
  | "onForgetWifi"
  | "onStartLiveView"
  | "onCancelCommissioning"
  | "onForceCommissioning"
>) {
  const getStatusVariant = (
    status?: string,
  ): "default" | "success" | "destructive" | "outline" | "secondary" => {
    if (!status) return "default";
    const s = status.toLowerCase();
    if (s.includes("active") || s.includes("online")) return "success";
    if (s.includes("error") || s.includes("offline")) return "destructive";
    if (s.includes("pending") || s.includes("warning")) return "outline";
    return "default";
  };

  const isAllE = cicData.allEStatus !== null;

  const scmLabel = getSupervisoryControlModeLabel(
    cicData.supervisoryControlMode,
  );

  return (
    <StickyHeader>
      <div className="flex flex-col gap-3">
        {/* Row 1: CIC ID and Last Update */}
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 md:text-2xl">
              {cicData.id}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                navigator.clipboard.writeText(cicData.id);
                toast.success("CIC ID copied to clipboard");
              }}
              title="Copy CIC ID"
            >
              <ClipboardCopy className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
          {cicData.lastConnectionStatusUpdatedAt && (
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last Update
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatDateDistance(
                  new Date(cicData.lastConnectionStatusUpdatedAt),
                )}
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Installation, Order, Status Badges, and External Links */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Installation & Order */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 md:text-sm">
              {cicData.installationUuid && (
                <Link
                  href={`/installations/${cicData.installationUuid}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
                >
                  Installation: {cicData.installationId}
                </Link>
              )}
              {cicData.orderNumber && <span>Order: {cicData.orderNumber}</span>}
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {cicData.status && (
                <Badge
                  variant={getStatusVariant(cicData.status)}
                  className="h-6"
                >
                  {cicData.status}
                </Badge>
              )}
              {cicData.supervisoryControlMode !== undefined &&
                cicData.supervisoryControlMode !== null && (
                  <Badge
                    variant="outline"
                    className="h-6 bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                  >
                    <span className="text-xs font-semibold">
                      SCM: {scmLabel} ({cicData.supervisoryControlMode})
                    </span>
                  </Badge>
                )}
            </div>
          </div>

          {/* External Links */}
          <div className="flex flex-wrap items-center gap-2">
            {cicData.orderNumber && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getHubspotSearchOrderLink(cicData.orderNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Hubspot Search Order
                </a>
              </Button>
            )}
            {cicData.menderId && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getMenderLink(cicData.menderId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Mender
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={isLoading}>
              <a
                href={getGrafanaDataPerCICLink(cicData.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Grafana
              </a>
            </Button>
            {isAllE && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getGrafanaAllEDashboardLink(cicData.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Grafana - All-E Dashboard
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={isLoading}>
              <Link
                href={`/cics/${cicData.id}/MQTTDebug`}
                className="flex items-center gap-2"
              >
                MQTT Debugger
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </StickyHeader>
  );
}
