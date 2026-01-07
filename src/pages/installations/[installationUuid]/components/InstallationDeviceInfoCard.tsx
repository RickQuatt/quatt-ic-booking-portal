import { Link } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { DataRow } from "@/components/shared/DetailPage";
import { formatDateDistance, formatDateTimeString } from "@/utils/formatDate";
import { getInstallationTypeLabel } from "@/utils/installationTypeEmojiMapper";
import { Badge } from "@/components/ui/Badge";

type AdminInstallationDetail = components["schemas"]["AdminInstallationDetail"];

export interface InstallationDeviceInfoCardProps {
  installation: AdminInstallationDetail;
}

/**
 * Device Information Card - Combines House Details and Installation Details
 * Uses DataRow pattern for consistent property/value display
 */
export function InstallationDeviceInfoCard({
  installation,
}: InstallationDeviceInfoCardProps) {
  const {
    zipCode,
    houseNumber,
    houseAddition,
    houseId,
    activeCic,
    quattBuild,
    installedAt,
    lastConnectionStatusUpdatedAt,
    heatDeliverySystems,
    hwid,
    odu1Type,
    odu2Type,
    isNlFlexPilotParticipant,
  } = installation;

  return (
    <div className="space-y-6">
      {/* House Details Section */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          House Details
        </h3>
        <div className="space-y-1">
          <DataRow label="House ID" value={houseId} />
          <DataRow label="Zip Code" value={zipCode} />
          <DataRow label="House Number" value={houseNumber} />
          <DataRow label="House Addition" value={houseAddition || "N/A"} />
        </div>
      </div>

      {/* Installation Details Section */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Installation Details
        </h3>
        <div className="space-y-1">
          <DataRow
            label="Active CIC"
            value={
              activeCic ? (
                <Link
                  href={`/cics/${activeCic}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {activeCic}
                </Link>
              ) : (
                "N/A - Home Battery Installation"
              )
            }
          />
          <DataRow
            label="Installation Type"
            value={getInstallationTypeLabel(installation.type)}
          />
          <DataRow label="Database ID" value={installation.id} />
          <DataRow label="Quatt Build" value={quattBuild} />
          <DataRow label="HWID" value={hwid} />
          <DataRow label="ODU 1 Type" value={odu1Type} />
          {odu2Type && <DataRow label="ODU 2 Type" value={odu2Type} />}
          <DataRow
            label="Last Connection"
            value={
              lastConnectionStatusUpdatedAt
                ? formatDateDistance(new Date(lastConnectionStatusUpdatedAt))
                : null
            }
          />
          <DataRow
            label="Installation Date"
            value={installedAt ? formatDateTimeString(installedAt) : null}
          />
          <DataRow
            label="Heating Systems"
            value={
              heatDeliverySystems && heatDeliverySystems.length > 0
                ? heatDeliverySystems.join(", ")
                : "No known heating systems"
            }
          />
          <DataRow
            label="FlexPilot Participant"
            value={
              <Badge
                variant={isNlFlexPilotParticipant ? "success" : "secondary"}
              >
                {isNlFlexPilotParticipant ? "Yes" : "No"}
              </Badge>
            }
          />
        </div>
      </div>
    </div>
  );
}
