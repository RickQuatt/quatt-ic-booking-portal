import { Link } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { StickyHeader } from "@/components/shared/DetailPage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink, ClipboardCopy, Flame, BarChart3 } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatDateDistance } from "@/utils/formatDate";
import {
  getInstallationTypeIcons,
  getInstallationTypeLabel,
} from "@/utils/installationTypeEmojiMapper";
import {
  getHubspotSearchOrderLink,
  getHubspotDealLink,
  getMenderLink,
  getGrafanaDataPerCICLink,
  getGrafanaDiagnosticsLink,
  getGrafanaAllEDashboardLink,
  getRetoolBatteryDashboardLink,
  getGrafanaChillStatsDashboardLink,
  getGrafanaUnifiedDashboardLink,
} from "@/constants/externalLinks";

type AdminInstallationDetail = components["schemas"]["AdminInstallationDetail"];

export interface InstallationHeaderProps {
  installation: AdminInstallationDetail;
  isLoading?: boolean;
}

/**
 * Sticky header for Installation detail page
 * Contains Installation UUID, country, type, status, last update, and quick links to external resources
 */
export function InstallationHeader({
  installation,
  isLoading = false,
}: InstallationHeaderProps) {
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

  const icons = getInstallationTypeIcons(installation.type);
  const typeLabel = getInstallationTypeLabel(installation.type);

  // Get the most recent commissioning to show last activity
  const lastConnection = installation.lastConnectionStatusUpdatedAt;

  // Hubspot link
  const hubspotDealLink = getHubspotDealLink(
    installation.hubspotDealId,
    installation.houseId,
  );
  const hubspotDealText = installation.houseId
    ? "Hubspot - House"
    : installation.hubspotDealId
      ? "Hubspot - Deal"
      : null;

  // Check if Home Battery installation
  const isHomeBattery = installation.type === "HOME_BATTERY";
  const batteryDevice = installation.devices?.find(
    (d) => d.type === "HOME_BATTERY",
  );
  const batterySn = batteryDevice?.serialNumber;

  // Check if Chill installation
  const chillDevice = installation.devices?.find((d) => d.type === "CHILL");

  // Check if All-Electric installation
  const isAllElectric =
    installation.type?.toUpperCase().includes("ALL_ELECTRIC") || false;

  return (
    <StickyHeader>
      <div className="flex flex-col gap-3">
        {/* Row 1: Installation UUID, Country, Type, Last Connection */}
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 md:text-2xl">
                {installation.externalId || "Unknown"}
              </h1>
              {installation.externalId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText(installation.externalId!);
                    toast.success("Installation ID copied to clipboard");
                  }}
                  title="Copy Installation ID"
                >
                  <ClipboardCopy className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {installation.country}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
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
                        Array.from({ length: heatPumpCount }).map((_, i) => (
                          <HeatPumpIcon
                            key={i}
                            className="h-4 w-4 text-gray-700 dark:text-gray-300"
                          />
                        ))}
                    </>
                  );
                })()}
              <span className="ml-1">{typeLabel}</span>
            </span>
          </div>
          {lastConnection && (
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last Connection
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatDateDistance(new Date(lastConnection))}
              </div>
            </div>
          )}
        </div>

        {/* Row 2: CIC Link, Order, Status Badges, and External Links */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* CIC & Order */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400 md:text-sm">
              {installation.activeCic && (
                <Link
                  href={`/cics/${installation.activeCic}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
                >
                  CIC: {installation.activeCic}
                </Link>
              )}
              {installation.orderNumber && (
                <span>Order: {installation.orderNumber}</span>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {installation.status && (
                <Badge
                  variant={getStatusVariant(installation.status)}
                  className="h-6"
                >
                  {installation.status}
                </Badge>
              )}
              {installation.cicCommissioning &&
                installation.cicCommissioning.length > 0 && (
                  <Badge variant="outline" className="h-6">
                    <span className="text-xs">
                      Commissioning:{" "}
                      {installation.cicCommissioning[0].isForced
                        ? "Forced"
                        : "Normal"}
                    </span>
                  </Badge>
                )}
            </div>
          </div>

          {/* External Links */}
          <div className="flex flex-wrap items-center gap-2">
            {hubspotDealText && hubspotDealLink && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={hubspotDealLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {hubspotDealText}
                </a>
              </Button>
            )}
            {installation.orderNumber && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getHubspotSearchOrderLink(installation.orderNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Hubspot - Order
                </a>
              </Button>
            )}
            {installation.menderId && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getMenderLink(installation.menderId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Mender
                </a>
              </Button>
            )}
            {installation.activeCic && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getGrafanaDataPerCICLink(installation.activeCic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Grafana - Data per CIC
                </a>
              </Button>
            )}
            {installation.activeCic && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getGrafanaDiagnosticsLink(installation.activeCic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Grafana - Diagnostics
                </a>
              </Button>
            )}
            {installation.activeCic && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getGrafanaUnifiedDashboardLink(installation.activeCic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Grafana - Unified Dashboard (BETA)
                </a>
              </Button>
            )}
            {installation.activeCic && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getGrafanaUnifiedDashboardLink(installation.activeCic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  BETA - Unified Dashboard
                </a>
              </Button>
            )}
            {installation.activeCic && isAllElectric && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getGrafanaAllEDashboardLink(installation.activeCic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Grafana - All-E Dashboard
                </a>
              </Button>
            )}
            {installation.activeCic &&
              chillDevice &&
              "serialNumber" in chillDevice &&
              typeof chillDevice.serialNumber === "string" &&
              chillDevice.serialNumber &&
              "eui64" in chillDevice &&
              typeof chillDevice.eui64 === "string" &&
              chillDevice.eui64 && (
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <a
                    href={getGrafanaChillStatsDashboardLink(
                      installation.activeCic,
                      chillDevice.serialNumber,
                      chillDevice.eui64,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Grafana - Chill Stats
                  </a>
                </Button>
              )}
            {installation.insightsStartAt && (
              <Link href={`/installations/${installation.externalId}/insights`}>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Insights
                  </span>
                </Button>
              </Link>
            )}
            {isHomeBattery && batterySn && (
              <Button variant="outline" size="sm" disabled={isLoading}>
                <a
                  href={getRetoolBatteryDashboardLink(batterySn)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Battery Dashboard
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </StickyHeader>
  );
}
