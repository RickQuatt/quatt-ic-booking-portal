/**
 * External link generation utilities for various services
 * (Grafana, Mender, HubSpot, Zuper, Retool)
 */

export function getMenderLink(id: string) {
  return `https://hosted.mender.io/ui/devices/accepted?sort=system:updated_ts:desc&id=${id}`;
}

export const getEnvironment = (): {
  isLocal: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
} => {
  const url = window.location.href;
  return {
    isLocal: url.includes("localhost"),
    isDevelopment:
      url.includes("internal-support-develop") ||
      url.includes("quatt-support-dashboard.pages.dev"),
    isStaging: url.includes("internal-support-staging"),
    isProduction:
      !url.includes("localhost") &&
      !url.includes("internal-support-develop") &&
      !url.includes("internal-support-staging") &&
      !url.includes("quatt-support-dashboard.pages.dev"),
  };
};

function buildGrafanaUrl(dashboardPath: string, params: string): string {
  const env = getEnvironment();
  const baseUrl =
    env.isLocal || env.isDevelopment
      ? "https://g-d4ebd27178.grafana-workspace.eu-west-1.amazonaws.com"
      : env.isStaging
        ? "https://g-2048f245a4.grafana-workspace.eu-west-1.amazonaws.com"
        : "https://g-736ff2fef7.grafana-workspace.eu-west-1.amazonaws.com";
  return `${baseUrl}/d/${dashboardPath}?${params}`;
}

export function getGrafanaDataPerCICLink(id: string) {
  return buildGrafanaUrl(
    "clickhouse-data-per-cic/clickhouse-data-per-cic",
    `var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`,
  );
}

export function getGrafanaAllEDashboardLink(id: string) {
  return buildGrafanaUrl(
    "all-e-dashboard/all-e-dashboard",
    `var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`,
  );
}

export function getGrafanaDiagnosticsLink(id: string) {
  return buildGrafanaUrl(
    "clickhouse-diagnostics/clickhouse-diagnostics",
    `var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`,
  );
}

export function getHubspotSearchOrderLink(orderNumber: string) {
  const env = getEnvironment();

  if (env.isLocal || env.isDevelopment || env.isStaging) {
    return `https://app.hubspot.com/contacts/139510613/objects/0-3/views/all/list?query="${orderNumber}"`;
  }
  return `https://app-eu1.hubspot.com/contacts/25848718/objects/0-3/views/all/list?query="${orderNumber}"`;
}

export function getHubspotDealLink(
  hubspotDealId: string | null,
  houseId: string | null,
) {
  const env = getEnvironment();

  if (env.isLocal || env.isDevelopment || env.isStaging) {
    if (houseId) {
      return `https://app-eu1.hubspot.com/contacts/139510613/record/2-138964309/${houseId}`;
    }
    return hubspotDealId
      ? `https://app-eu1.hubspot.com/contacts/139510613/record/0-3/${hubspotDealId}`
      : undefined;
  }
  if (houseId) {
    return `https://app-eu1.hubspot.com/contacts/25848718/record/2-138343985/${houseId}`;
  }
  return hubspotDealId
    ? `https://app-eu1.hubspot.com/contacts/25848718/record/0-3/${hubspotDealId}`
    : undefined;
}

export function getZuperJobLink(jobUid: string) {
  return `https://app.zuperpro.com/jobs/${jobUid}/details`;
}

export function getGrafanaChillStatsDashboardLink(
  cicId: string,
  serialNumber: string,
  eui64: string,
) {
  return buildGrafanaUrl(
    "chill-stats-dashboard/chill-stats-dashboard",
    `orgId=1&refresh=30s&var-cic_uuid=${cicId}&var-serialNumber=${serialNumber}&var-eui64=${eui64}`,
  );
}

export function getRetoolBatteryDashboardLink(batterySn: string) {
  return `https://quatt.retool.com/app/battery-dashboard?_environment=production&battery_sn=${batterySn}`;
}
