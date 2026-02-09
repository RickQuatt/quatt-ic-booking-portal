import { useMemo } from "react";
import type { components } from "@/openapi-client/types/api/v1";
import { $api } from "@/openapi-client/context";

type BoilerType = components["schemas"]["BoilerType"];
type CicHealthCheckStatus = components["schemas"]["CicHealthCheckStatus"];
type DeviceConnectionStatuses =
  components["schemas"]["DeviceConnectionStatuses"];
type InternetConnectionStatuses =
  components["schemas"]["InternetConnectionStatuses"];
type ThermostatType = components["schemas"]["ThermostatType"];
import { DataRow } from "@/components/shared/DetailPage";
import { Loader } from "@/components/shared/Loader";
import { ErrorText } from "@/components/shared/ErrorText";
import { roundNumber } from "@/utils/number";

interface InstallationHealthCardProps {
  installationUuid: string;
  cicId: string;
  thermostatType: ThermostatType | null;
  deviceConnectionStatuses: DeviceConnectionStatuses;
  internetConnectionStatuses: InternetConnectionStatuses;
  boilerType?: BoilerType | null;
  numberOfHeatPumps: number | null;
  isAllE: boolean;
}

const healthcheckTextByStatusForConnectivity: Record<
  CicHealthCheckStatus,
  string
> = {
  correct: "Connected",
  error: "Disconnected",
  warning: "Warning",
  notApplicable: "N/A",
};

/**
 * Format status with colored indicator (returns ReactNode for DataRow)
 */
const formatStatus = (
  status: CicHealthCheckStatus,
  customErrorText?: string,
): React.ReactNode => {
  const text =
    status === "error" && customErrorText
      ? customErrorText
      : healthcheckTextByStatusForConnectivity[status];

  const colorClass =
    status === "correct"
      ? "text-green-600 dark:text-green-400"
      : status === "error"
        ? "text-red-600 dark:text-red-400"
        : status === "warning"
          ? "text-yellow-600 dark:text-yellow-400"
          : "text-gray-500 dark:text-gray-400";

  const indicator =
    status === "correct"
      ? "✓"
      : status === "error"
        ? "✗"
        : status === "warning"
          ? "⚠"
          : "—";

  return (
    <span className={colorClass}>
      {indicator} {text}
    </span>
  );
};

/**
 * Format restart status with colored indicator and count
 */
const formatRestartStatus = (healthCheck: {
  status: "ok" | "warning" | "error";
  count: number;
  message?: string | null;
}): React.ReactNode => {
  const isWarning = healthCheck.status === "warning";
  const icon = isWarning ? "⚠" : "✓";
  const colorClass = isWarning
    ? "text-yellow-600 dark:text-yellow-400"
    : "text-green-600 dark:text-green-400";

  const displayText =
    healthCheck.message ||
    `${healthCheck.count} restart${healthCheck.count !== 1 ? "s" : ""}`;

  return (
    <span className={colorClass}>
      {icon} {displayText}
    </span>
  );
};

/**
 * Installation Health Checks Card
 * Displays system health metrics, device connections, and connectivity status
 */
export function InstallationHealthCard({
  cicId,
  thermostatType,
  deviceConnectionStatuses,
  internetConnectionStatuses,
  boilerType,
  numberOfHeatPumps,
  isAllE,
}: InstallationHealthCardProps) {
  const {
    data: healthCheckData,
    error: isError,
    isPending,
    refetch,
  } = $api.useQuery("get", "/admin/cic/{cicId}/healthchecks", {
    params: {
      path: { cicId },
    },
  });

  const chResults = healthCheckData?.result;

  const healthCheckCicNumberOfRestarts = useMemo(
    () =>
      healthCheckData?.result?.healthchecks.find(
        (healthcheck) => healthcheck.type === "CIC_NUMBER_OF_RESTARTS",
      ),
    [healthCheckData],
  );

  if (isPending) {
    return <Loader />;
  }

  if (isError) {
    return (
      <ErrorText
        text="Failed to fetch health check data for the installation."
        retry={() => refetch()}
      />
    );
  }

  const isOpenthermBoiler = boilerType === "opentherm";
  const heatPumpErrorText =
    numberOfHeatPumps === 1
      ? "Heat pump not connected"
      : "At least one heat pump disconnected";

  const pressureChange = roundNumber(chResults?.pressureChange ?? undefined, 1);

  // Temperature data extraction
  const tempTitle =
    thermostatType === "opentherm_room_temperature"
      ? "Room temperature"
      : thermostatType === "opentherm_without_room_temperature"
        ? "Water temperature"
        : "Temperature";

  const setpointTitle =
    thermostatType === "opentherm_room_temperature"
      ? "Room setpoint"
      : thermostatType === "opentherm_without_room_temperature"
        ? "Water setpoint"
        : "Setpoint";

  const tempValue =
    thermostatType === "opentherm_room_temperature"
      ? chResults?.roomTemperature
      : thermostatType === "opentherm_without_room_temperature"
        ? chResults?.waterTemperature
        : null;

  const setpointValue =
    thermostatType === "opentherm_room_temperature"
      ? chResults?.roomSetpoint
      : thermostatType === "opentherm_without_room_temperature"
        ? chResults?.waterSetpoint
        : null;

  const setpointAdherenceValue =
    thermostatType === "opentherm_room_temperature"
      ? chResults?.setpointAdherence
      : thermostatType === "opentherm_without_room_temperature"
        ? chResults?.waterTemperatureSetpointAdherence
        : null;

  const setpointReachedText =
    setpointAdherenceValue !== null && setpointAdherenceValue !== undefined
      ? `${roundNumber(setpointAdherenceValue, 1)}%`
      : "N/A";

  const setpointReachedStatus: CicHealthCheckStatus =
    setpointAdherenceValue !== null &&
    setpointAdherenceValue !== undefined &&
    setpointAdherenceValue < 80
      ? "warning"
      : "correct";

  return (
    <div className="space-y-6">
      {/* All Health Check Metrics */}
      <div className="space-y-1">
        <DataRow
          label={tempTitle}
          value={
            tempValue !== null && tempValue !== undefined
              ? `${tempValue}°C`
              : null
          }
        />
        <DataRow
          label={setpointTitle}
          value={
            setpointValue !== null && setpointValue !== undefined
              ? `${setpointValue}°C`
              : null
          }
        />
        <DataRow
          label="Setpoint reached"
          value={
            setpointReachedText +
            (setpointReachedStatus === "warning"
              ? " (Issues with heating)"
              : "")
          }
        />
        <DataRow
          label="Supervisory Control Mode"
          value={chResults?.supervisoryControlMode}
        />
        <DataRow
          label="Flow Ratio"
          value={
            chResults?.flowRatio !== null && chResults?.flowRatio !== undefined
              ? `${roundNumber(chResults.flowRatio, 1)}%`
              : null
          }
        />
        <DataRow
          label="Pressure Change"
          value={pressureChange !== null ? pressureChange : null}
        />
        <DataRow label="Mode Reparation" value={null} />
      </div>

      {/* Peripheral Devices */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Peripheral Devices
        </h3>
        <div className="space-y-1">
          <DataRow
            label="Heat Pump(s)"
            value={formatStatus(
              deviceConnectionStatuses.heatPumpsConnected,
              heatPumpErrorText,
            )}
          />
          <DataRow
            label="Thermostat"
            value={formatStatus(
              deviceConnectionStatuses.thermostatConnected,
              "Thermostat not connected",
            )}
          />
          {isOpenthermBoiler && (
            <DataRow
              label="Boiler"
              value={formatStatus(
                deviceConnectionStatuses.openthermBoilerConnected,
                "Opentherm boiler not connected",
              )}
            />
          )}
          {isAllE && deviceConnectionStatuses.heatChargerConnected && (
            <DataRow
              label="All-E Heat Charger"
              value={formatStatus(
                deviceConnectionStatuses.heatChargerConnected,
                heatPumpErrorText,
              )}
            />
          )}
        </div>
      </div>

      {/* Connectivity */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Connectivity
        </h3>
        <div className="space-y-1">
          <DataRow
            label="WiFi"
            value={formatStatus(
              internetConnectionStatuses.connectionToWifi,
              "WiFi not connected",
            )}
          />
          <DataRow
            label="Ethernet"
            value={formatStatus(
              internetConnectionStatuses.connectionToEthernet,
              "Ethernet not connected",
            )}
          />
          <DataRow
            label="Internet"
            value={formatStatus(
              internetConnectionStatuses.isInternetReachable,
              "The CIC does not have internet access",
            )}
          />
          {healthCheckCicNumberOfRestarts && (
            <DataRow
              label="CIC Restarts last 24h"
              value={formatRestartStatus(healthCheckCicNumberOfRestarts)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
