
export interface CICEntry {
  id: string;
  cableConnectionStatus: "disconnected" | "connected" | "not_reachable"
  wifiConnectionStatus: "disconnected" | "connected" | "not_reachable"
  lteConnectionStatus: "disconnected" | "connected" | "not_reachable"
  supervisoryControlMode: null | number
  orderNumber: null | string
  createdAt: string // ISO date
  lastConnectionStatusUpdatedAt: string // ISO date
}

export type CICEntryList = CICEntry[]

export interface CICEntryDetail extends CICEntry {
  quattBuild: string;
}
