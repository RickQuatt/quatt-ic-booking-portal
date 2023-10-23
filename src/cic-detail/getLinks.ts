export function getMenderLink(id: string) {
  return `https://hosted.mender.io/ui/devices/accepted?sort=system:updated_ts:desc&id=${id}`;
}

export function getGrafanaLink(id: string) {
  return `https://g-736ff2fef7.grafana-workspace.eu-west-1.amazonaws.com/d/2iE68EiSkB/clickhouse-data-per-cic?var-cic_uuid=${id}&from=now-6h&to=now&orgId=1&refresh=30s`;
}

export function getHubspotSearchOrderLink(orderNumber: string) {
  return `https://app-eu1.hubspot.com/contacts/25848718/objects/0-3/views/all/list?query="${orderNumber}"`;
}
