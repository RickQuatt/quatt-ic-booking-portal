import { ColumnDef } from "@tanstack/react-table";
import { Link } from "wouter";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatDate";
import type { components } from "@/openapi-client/types/api/v1";
import { DeviceType, DeviceStatus } from "@/constants/enums";

type DeviceItem = components["schemas"]["AdminDeviceListItem"];
type DeviceStatusType = components["schemas"]["DeviceStatus"];

// Status badge variant mapping
const getStatusVariant = (
  status?: DeviceStatusType,
): "success" | "destructive" | "secondary" | "default" => {
  if (!status) return "secondary";

  switch (status) {
    case "ACTIVE":
      return "success";
    case "IN_ERROR":
      return "destructive";
    case "PENDING_COMMISSIONING":
      return "default";
    case "UNINSTALLED":
    case "FACTORY":
      return "secondary";
    default:
      return "secondary";
  }
};

export const deviceColumns: ColumnDef<DeviceItem>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as components["schemas"]["DeviceType"];
      return (
        <span className="text-sm font-medium">{DeviceType.getLabel(type)}</span>
      );
    },
  },
  {
    accessorKey: "deviceUuid",
    header: "Device UUID",
    cell: ({ row }) => {
      const uuid = row.getValue("deviceUuid") as string;
      return <span className="font-mono text-xs">{uuid}</span>;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string | null;
      return <span className="text-sm">{name || "—"}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as DeviceStatusType | undefined;
      return (
        <Badge variant={getStatusVariant(status)} className="text-xs">
          {status ? DeviceStatus.getLabel(status) : "Unknown"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
    cell: ({ row }) => {
      const serialNumber = row.getValue("serialNumber") as string | null;
      return <span className="text-sm">{serialNumber || "—"}</span>;
    },
  },
  {
    accessorKey: "eui64",
    header: "EUI64",
    cell: ({ row }) => {
      const eui64 = row.getValue("eui64") as string | null;
      return <span className="font-mono text-xs">{eui64 || "—"}</span>;
    },
  },
  {
    accessorKey: "installationUuid",
    header: "Installation",
    cell: ({ row }) => {
      const uuid = row.getValue("installationUuid") as string | null;
      return uuid ? (
        <Link
          href={`/installations/${uuid}`}
          className="font-mono text-xs text-blue-600 hover:underline"
        >
          {uuid}
        </Link>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      );
    },
  },
  {
    accessorKey: "cicId",
    header: "CIC ID",
    cell: ({ row }) => {
      const cicId = row.getValue("cicId") as string | null;
      return cicId ? (
        <Link
          href={`/cics/${cicId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          {cicId}
        </Link>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string | undefined;
      return date ? (
        <span className="text-sm">{formatDate(new Date(date))}</span>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as string | undefined;
      return date ? (
        <span className="text-sm">{formatDate(new Date(date))}</span>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      );
    },
  },
];
