import classes from "./InstallationHealthChecks.module.css";
import { useApiClient } from "../api-client/context";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "../ui-components/loader/Loader";
import ErrorText from "../ui-components/error-text/ErrorText";
import {
  BoilerType,
  DeviceConnectionStatuses,
  InternetConnectionStatuses,
  ThermostatType,
} from "../api-client/models";
import DetailBlock from "../ui-components/detail-block/DetailBlock";
import InstallationDetailTemperatureDetails from "./InstallationDetailTemperatureDetails";
import HealthCheckText from "../ui-components/health-check-text/HealthCheckText";
import InstallationModeReparation from "./InstallationModeReparation";

interface InstallationHealthCheckProps {
  orderNumber: string;
  cicId: string;
  thermostatType: ThermostatType | null;
  deviceConnectionStatuses: DeviceConnectionStatuses;
  internetConnectionStatuses: InternetConnectionStatuses;
  boilerType: BoilerType | null;
  numberOfHeatPumps: number | null;
}

export function InstallationHealthChecks({
  orderNumber,
  cicId,
  thermostatType,
  deviceConnectionStatuses,
  internetConnectionStatuses,
  boilerType,
  numberOfHeatPumps,
}: InstallationHealthCheckProps) {
  const apiClient = useApiClient();

  const {
    data: healthCheckData,
    isError,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["installationHealthCheck", orderNumber, cicId],
    queryFn: () =>
      apiClient.adminGetInstallationHealthCheck({
        orderNumber,
        cicId,
      }),
  });
  const chResults = healthCheckData?.result;

  if (isPending) {
    return <Loader />;
  }

  const isOpenthermBoiler = boilerType === BoilerType.Opentherm;
  const heatPumpErrorText =
    numberOfHeatPumps === 1
      ? "Heat pump not connected"
      : "At least one heat pump disconnected";

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
        </div>
      )}
      <p className={classes["sub-header"]}>Peripheral devices connection</p>
      <HealthCheckText
        title="Heat pump(s)"
        status={deviceConnectionStatuses.heatPumpsConnected}
        errorStatusText={heatPumpErrorText}
      />
      <HealthCheckText
        title="Thermostat"
        status={deviceConnectionStatuses.thermostatConnected}
        errorStatusText="Thermostat not connected"
      />
      {isOpenthermBoiler && (
        <HealthCheckText
          title="Boiler"
          status={deviceConnectionStatuses.openthermBoilerConnected}
          errorStatusText="Opentherm boiler not connected"
        />
      )}
      <p className={classes["sub-header"]}>Connectivity</p>
      <HealthCheckText
        title="WiFi"
        status={internetConnectionStatuses.connectionToWifi}
        errorStatusText="WiFi not connected"
        notApplicableStatusText="WiFi connection status not available"
      />
      <HealthCheckText
        title="Ethernet"
        status={internetConnectionStatuses.connectionToEthernet}
        errorStatusText="Ethernet not connected"
      />
      <HealthCheckText
        title="Internet"
        status={internetConnectionStatuses.isInternetReachable}
        errorStatusText="The CIC does not have internet access"
      />
    </>
  );
}
