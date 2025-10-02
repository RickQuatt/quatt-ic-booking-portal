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
    isDevelopment: url.includes("internal-support-develop"),
    isStaging: url.includes("internal-support-staging"),
    isProduction:
      !url.includes("localhost") &&
      !url.includes("internal-support-develop") &&
      !url.includes("internal-support-staging"),
  };
};

export function getGrafanaDataPerCICLink(id: string) {
  const env = getEnvironment();

  if (env.isLocal || env.isDevelopment) {
    return `https://g-d4ebd27178.grafana-workspace.eu-west-1.amazonaws.com/d/2iE68EiSkB/clickhouse-data-per-cic?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
  } else if (env.isStaging) {
    return `https://g-2048f245a4.grafana-workspace.eu-west-1.amazonaws.com/d/clickhouse-data-per-cic/clickhouse-data-per-cic?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
  }

  return `https://g-736ff2fef7.grafana-workspace.eu-west-1.amazonaws.com/d/clickhouse-data-per-cic/clickhouse-data-per-cic?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
}

export function getGrafanaAllEDashboardLink(id: string) {
  const env = getEnvironment();
  if (env.isLocal || env.isDevelopment) {
    return `https://g-d4ebd27178.grafana-workspace.eu-west-1.amazonaws.com/d/all-e-dashboard/all-e-dashboard?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
  }
  if (env.isStaging) {
    return `https://g-2048f245a4.grafana-workspace.eu-west-1.amazonaws.com/d/all-e-dashboard/all-e-dashboard?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
  }
  return `https://g-736ff2fef7.grafana-workspace.eu-west-1.amazonaws.com/d/all-e-dashboard/all-e-dashboard?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
}

export function getGrafanaDiagnosticsLink(id: string) {
  const env = getEnvironment();

  if (env.isLocal || env.isDevelopment) {
    return `https://g-d4ebd27178.grafana-workspace.eu-west-1.amazonaws.com/d/clickhouse-diagnostics/clickhouse-diagnostics?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
  } else if (env.isStaging) {
    return `https://g-2048f245a4.grafana-workspace.eu-west-1.amazonaws.com/d/clickhouse-diagnostics/clickhouse-diagnostics?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
  }

  return `https://g-736ff2fef7.grafana-workspace.eu-west-1.amazonaws.com/d/clickhouse-diagnostics/clickhouse-diagnostics?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
}

export function getHubspotSearchOrderLink(orderNumber: string) {
  const env = getEnvironment();

  if (env.isLocal || env.isDevelopment || env.isStaging) {
    return `https://app.hubspot.com/contacts/139510613/objects/0-3/views/all/list?query="${orderNumber}"`;
  }
  return `https://app-eu1.hubspot.com/contacts/25848718/objects/0-3/views/all/list?query="${orderNumber}"`;
}

export function getHubspotDealLink(hubspotDealId: string | null) {
  const env = getEnvironment();

  if (env.isLocal || env.isDevelopment || env.isStaging) {
    return hubspotDealId
      ? `https://app-eu1.hubspot.com/contacts/139510613/record/0-3/${hubspotDealId}`
      : undefined;
  }
  return hubspotDealId
    ? `https://app-eu1.hubspot.com/contacts/25848718/record/0-3/${hubspotDealId}`
    : undefined;
}

export function getZuperJobLink(jobUid: string) {
  return `https://app.zuperpro.com/jobs/${jobUid}/details`;
}

export function getRetoolBatteryDashboardLink(batterySn: string) {
  return `https://quatt.retool.com/app/battery-dashboard?_environment=production&battery_sn=${batterySn}`;
}
