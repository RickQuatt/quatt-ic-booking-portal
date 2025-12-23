import { ColumnDef } from "@tanstack/react-table";
import { Link } from "wouter";
import { formatDate, formatDateDistance } from "@/utils/formatDate";
import {
  getGrafanaDataPerCICLink,
  getMenderLink,
} from "@/constants/externalLinks";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "lucide-react";
import type { components } from "@/openapi-client/types/api/v1";
import { ConnectionStatus } from "@/constants/enums";

type AdminCic = components["schemas"]["AdminCic"];
type ConnectionStatusType = components["schemas"]["ConnectionStatus"];

// Connection status color mapping
const getConnectionStatusVariant = (
  status: ConnectionStatusType | null | undefined,
): "success" | "destructive" | "secondary" => {
  if (!status) return "secondary";

  switch (status) {
    case "connected":
      return "success"; // Green
    case "disconnected":
    case "not_reachable":
    case "bad_credentials":
      return "destructive"; // Red
    default:
      return "secondary"; // Gray
  }
};

export const cicColumns: ColumnDef<AdminCic>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return (
        <Link href={`/cics/${id}`} className="text-blue-600 hover:underline">
          {id}
        </Link>
      );
    },
  },
  {
    accessorKey: "cableConnectionStatus",
    header: "Cable",
    cell: ({ row }) => {
      const status = row.getValue(
        "cableConnectionStatus",
      ) as ConnectionStatusType | null;
      return (
        <Badge variant={getConnectionStatusVariant(status)} className="text-xs">
          {status ? ConnectionStatus.getLabel(status) : "Unknown"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "wifiConnectionStatus",
    header: "WiFi",
    cell: ({ row }) => {
      const status = row.getValue(
        "wifiConnectionStatus",
      ) as ConnectionStatusType | null;
      return (
        <Badge variant={getConnectionStatusVariant(status)} className="text-xs">
          {status ? ConnectionStatus.getLabel(status) : "Unknown"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lteConnectionStatus",
    header: "LTE",
    cell: ({ row }) => {
      const status = row.getValue(
        "lteConnectionStatus",
      ) as ConnectionStatusType | null;
      return (
        <Badge variant={getConnectionStatusVariant(status)} className="text-xs">
          {status ? ConnectionStatus.getLabel(status) : "Unknown"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "supervisoryControlMode",
    header: "Supervisory Mode",
    cell: ({ row }) => {
      const mode = row.getValue("supervisoryControlMode") as number | null;
      return <span className="text-sm">{mode ?? "N/A"}</span>;
    },
  },
  {
    accessorKey: "orderNumber",
    header: "Order Number",
    cell: ({ row }) => {
      const orderNumber = row.getValue("orderNumber") as string | null;
      return <span className="text-sm">{orderNumber || "N/A"}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      return <span className="text-sm">{formatDate(new Date(dateStr))}</span>;
    },
  },
  {
    accessorKey: "lastConnectionStatusUpdatedAt",
    header: "Last Connection",
    cell: ({ row }) => {
      const dateStr = row.getValue("lastConnectionStatusUpdatedAt") as
        | string
        | null;
      return (
        <span className="text-sm">
          {dateStr ? formatDateDistance(new Date(dateStr)) : "Never"}
        </span>
      );
    },
  },
  {
    id: "mender",
    header: "Mender",
    cell: ({ row }) => {
      const menderId = row.original.menderId;
      if (!menderId) return <span className="text-sm text-gray-400">N/A</span>;

      const menderLink = getMenderLink(menderId);
      return (
        <Button variant="outline" size="sm" className="h-8 w-full px-2">
          <a href={menderLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      );
    },
  },
  {
    id: "grafana",
    header: "Grafana",
    cell: ({ row }) => {
      const id = row.original.id;
      const grafanaLink = getGrafanaDataPerCICLink(id);
      return (
        <Button variant="outline" size="sm" className="h-8 w-full px-2">
          <a href={grafanaLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      );
    },
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <Button variant="default" size="sm" className="h-8 w-full">
          <Link href={`/cics/${id}`}>View</Link>
        </Button>
      );
    },
  },
];
