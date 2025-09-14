import "@tanstack/react-query";
import { ResponseError } from "./api-client/runtime";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ResponseError;
  }
}
export interface CICEntry {
  id: string;
  cableConnectionStatus: "disconnected" | "connected" | "not_reachable";
  wifiConnectionStatus: "disconnected" | "connected" | "not_reachable";
  lteConnectionStatus: "disconnected" | "connected" | "not_reachable";
  supervisoryControlMode: null | number;
  orderNumber: null | string;
  createdAt: string; // ISO date
  lastConnectionStatusUpdatedAt: string; // ISO date
}

export type CICEntryList = CICEntry[];

export interface CICEntryDetail extends CICEntry {
  quattBuild: string;
}

export interface PricingDataPoint {
  hour: number;
  price: number;
  timestamp: string;
  validFrom: string;
  validTo: string;
  formattedValidFrom: string;
  formattedValidTo: string;
}
