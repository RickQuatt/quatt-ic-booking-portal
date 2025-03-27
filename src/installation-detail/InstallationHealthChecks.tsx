import classes from "./InstallationHealthChecks.module.css";
import { useApiClient } from "../api-client/context";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "../ui-components/loader/Loader";
import ErrorText from "../ui-components/error-text/ErrorText";
import {
  BoilerType,
  CicHealthCheckStatus,
  DeviceConnectionStatuses,
  InternetConnectionStatuses,
  ThermostatType,
} from "../api-client/models";
import DetailBlock, {
  UnitSuffix,
} from "../ui-components/detail-block/DetailBlock";
import InstallationDetailTemperatureDetails from "./InstallationDetailTemperatureDetails";
import HealthCheckText from "../ui-components/health-check-text/HealthCheckText";
import InstallationModeReparation from "./InstallationModeReparation";
import { roundNumber } from "../utils/number";
import ThresholdCheck from "../ui-components/threshold-check/ThresholdCheck";
import { useMemo } from "react";

interface InstallationHealthCheckProps {
  iuid: string;
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
  [CicHealthCheckStatus.Correct]: "Connected",
  [CicHealthCheckStatus.Error]: "Disconnected",
  [CicHealthCheckStatus.Warning]: "Warning",
  [CicHealthCheckStatus.NotApplicable]: "N/A",
};

export function InstallationHealthChecks({
  iuid,
  cicId,
  thermostatType,
  deviceConnectionStatuses,
  internetConnectionStatuses,
  boilerType,
  numberOfHeatPumps,
  isAllE,
}: InstallationHealthCheckProps) {
  const apiClient = useApiClient();

  const {
    data: healthCheckData,
    isError,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["installationHealthCheck", iuid, cicId],
    queryFn: () =>
      apiClient.adminGetCicHealthCheck({
        cicId,
      }),
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

  const isOpenthermBoiler = boilerType === BoilerType.Opentherm;
  const heatPumpErrorText =
    numberOfHeatPumps === 1
      ? "Heat pump not connected"
      : "At least one heat pump disconnected";

  const pressureChange = roundNumber(chResults?.pressureChange ?? undefined, 1);

  return (
    <>
      {isError ? (
        <ErrorText
          text="Failed to fetch health check data for the installation."
          retry={refetch}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr",
          }}
        >
          <InstallationDetailTemperatureDetails
            chResults={chResults}
            thermostatType={thermostatType}
          />
          <InstallationModeReparation
            modeReparation={chResults?.modeReparation}
          />
          <DetailBlock
            title="Supervisory control mode"
            value={chResults?.supervisoryControlMode}
          />
          <ThresholdCheck
            title="Flow"
            displayValue={roundNumber(chResults?.flowRatio ?? undefined, 1)}
            unitSuffix={UnitSuffix.PERCENTAGE}
            lowerThreshold={80}
            lowerThresholdMessage="Issues with the flow"
          />
          <ThresholdCheck
            title="Pressure change"
            displayValue={pressureChange}
            lowerThreshold={-0.5}
            upperThreshold={0.5}
            lowerThresholdMessage="Unexpected pressure change"
          />
        </div>
      )}
      <p className={classes["sub-header"]}>Peripheral devices connection</p>
      <HealthCheckText
        title="Heat pump(s)"
        status={deviceConnectionStatuses.heatPumpsConnected}
        errorStatusText={heatPumpErrorText}
        text={
          healthcheckTextByStatusForConnectivity[
            deviceConnectionStatuses.heatPumpsConnected
          ]
        }
      />
      <HealthCheckText
        title="Thermostat"
        status={deviceConnectionStatuses.thermostatConnected}
        errorStatusText="Thermostat not connected"
        text={
          healthcheckTextByStatusForConnectivity[
            deviceConnectionStatuses.thermostatConnected
          ]
        }
      />
      {isOpenthermBoiler && (
        <HealthCheckText
          title="Boiler"
          status={deviceConnectionStatuses.openthermBoilerConnected}
          errorStatusText="Opentherm boiler not connected"
          text={
            healthcheckTextByStatusForConnectivity[
              deviceConnectionStatuses.openthermBoilerConnected
            ]
          }
        />
      )}
      {isAllE && deviceConnectionStatuses.heatChargerConnected ? (
        <HealthCheckText
          title="All-E Heat Charger"
          status={deviceConnectionStatuses.heatChargerConnected}
          errorStatusText={heatPumpErrorText}
          text={
            healthcheckTextByStatusForConnectivity[
              deviceConnectionStatuses.heatChargerConnected
            ]
          }
        />
      ) : null}
      <p className={classes["sub-header"]}>Connectivity</p>
      <HealthCheckText
        title="WiFi"
        status={internetConnectionStatuses.connectionToWifi}
        errorStatusText="WiFi not connected"
        notApplicableStatusText="WiFi connection status not available"
        text={
          healthcheckTextByStatusForConnectivity[
            internetConnectionStatuses.connectionToWifi
          ]
        }
      />
      <HealthCheckText
        title="Ethernet"
        status={internetConnectionStatuses.connectionToEthernet}
        errorStatusText="Ethernet not connected"
        text={
          healthcheckTextByStatusForConnectivity[
            internetConnectionStatuses.connectionToEthernet
          ]
        }
      />
      <HealthCheckText
        title="Internet"
        status={internetConnectionStatuses.isInternetReachable}
        errorStatusText="The CIC does not have internet access"
        text={
          healthcheckTextByStatusForConnectivity[
            internetConnectionStatuses.isInternetReachable
          ]
        }
      />
      {healthCheckCicNumberOfRestarts && (
        <HealthCheckText
          title="CIC Restarts last 24h"
          text={healthCheckCicNumberOfRestarts.count.toString()}
          status={
            healthCheckCicNumberOfRestarts.status === "warning"
              ? CicHealthCheckStatus.Warning
              : CicHealthCheckStatus.Correct
          }
          errorStatusText={healthCheckCicNumberOfRestarts.message || ""}
        />
      )}
    </>
  );
}
