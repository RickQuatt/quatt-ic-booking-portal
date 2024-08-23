import classes from "./InstallationDetailTopBar.module.css";
import {
  BoilerType,
  DeviceConnectionStatuses,
  ThermostatType,
} from "../api-client/models";
import HealthCheckIndicator from "./HealthCheckIndicator";

interface InstallationDetailTopBarProps {
  orderNumber: string;
  deviceConnectionStatuses: DeviceConnectionStatuses;
  boilerType: BoilerType | null;
  numberOfHeatPumps: number | null;
  thermostatType: ThermostatType | null;
}

function InstallationDetailTopBar({
  orderNumber,
  deviceConnectionStatuses,
  boilerType,
  numberOfHeatPumps,
  thermostatType,
}: InstallationDetailTopBarProps) {
  const isOpenthermBoiler = boilerType === BoilerType.Opentherm;
  const heatPumpErrorText =
    numberOfHeatPumps === 1
      ? "Heat pump not connected"
      : "At least one heat pump disconnected";

  const tempControlErrorText =
    thermostatType === ThermostatType.OpenthermRoomTemperature
      ? "The latest update did not include the room temperature or setpoint"
      : "The latest update did not include the water temperature value";

  return (
    <section className={classes["top-bar"]}>
      <span className={classes["top-bar-title"]}>{orderNumber}</span>
      <div className={classes["health-checks-wrapper"]}>
        <span>Connection status</span>
        <HealthCheckIndicator
          title="Heat pump(s)"
          status={deviceConnectionStatuses.heatPumpsConnected}
          errorStatusText={heatPumpErrorText}
        />
        <HealthCheckIndicator
          title="Thermostat"
          status={deviceConnectionStatuses.thermostatConnected}
          errorStatusText="Thermostat not connected"
        />
        <HealthCheckIndicator
          title="Temperature control"
          status={deviceConnectionStatuses.temperatureControlConnected}
          errorStatusText={tempControlErrorText}
        />
        {isOpenthermBoiler && (
          <HealthCheckIndicator
            title="Boiler"
            status={deviceConnectionStatuses.openthermBoilerConnected}
            errorStatusText="Opentherm boiler not connected"
          />
        )}
      </div>
    </section>
  );
}

export default InstallationDetailTopBar;
