import { get } from "lodash-es";
import { InstallationHealthCheck, ThermostatType } from "../api-client/models";
import DetailBlock, {
  UnitSuffix,
} from "../ui-components/detail-block/DetailBlock";
import { roundNumber } from "../utils/number";

interface InstallationDetailTemperatureAndSetpointProps {
  chResults?: InstallationHealthCheck;
  thermostatType: ThermostatType | null;
}

const MISSING_THERMOSTAT_TYPE_TEMPERATURE_TITLE =
  "Missing thermostat type, temperature";
const MISSING_THERMOSTAT_TYPE_SETPOINT_TITLE =
  "Missing thermostat type, setpoint";

type TitlesByThermostatType = {
  [key in ThermostatType]: string;
};

const tempTitles: TitlesByThermostatType = {
  [ThermostatType.OpenthermRoomTemperature]: "Room temperature",
  [ThermostatType.OpenthermWithoutRoomTemperature]: "Water temperature",
  [ThermostatType.Null]: MISSING_THERMOSTAT_TYPE_TEMPERATURE_TITLE,
};

const setpointTitles: TitlesByThermostatType = {
  [ThermostatType.OpenthermRoomTemperature]: "Room setpoint",
  [ThermostatType.OpenthermWithoutRoomTemperature]: "Water setpoint",
  [ThermostatType.Null]: MISSING_THERMOSTAT_TYPE_SETPOINT_TITLE,
};

type TemperatureHealthCheckKeys = Pick<
  InstallationHealthCheck,
  | "roomTemperature"
  | "roomSetpoint"
  | "waterTemperature"
  | "waterSetpoint"
  | "setpointAdherence"
  | "waterTemperatureSetpointAdherence"
>;

type HealthCheckValueKeyByThermostatType = {
  [key in ThermostatType]: keyof TemperatureHealthCheckKeys;
};

const tempValues: HealthCheckValueKeyByThermostatType = {
  [ThermostatType.OpenthermRoomTemperature]: "roomTemperature",
  [ThermostatType.OpenthermWithoutRoomTemperature]: "waterTemperature",
  [ThermostatType.Null]: "roomTemperature",
};

const setpointValues: HealthCheckValueKeyByThermostatType = {
  [ThermostatType.OpenthermRoomTemperature]: "roomSetpoint",
  [ThermostatType.OpenthermWithoutRoomTemperature]: "waterSetpoint",
  [ThermostatType.Null]: "roomSetpoint",
};

const setpointAdherenceValues: HealthCheckValueKeyByThermostatType = {
  [ThermostatType.OpenthermRoomTemperature]: "setpointAdherence",
  [ThermostatType.OpenthermWithoutRoomTemperature]:
    "waterTemperatureSetpointAdherence",
  [ThermostatType.Null]: "setpointAdherence",
};

function InstallationDetailTemperatureDetails({
  chResults,
  thermostatType,
}: InstallationDetailTemperatureAndSetpointProps) {
  const tempTitle = thermostatType
    ? tempTitles[thermostatType as keyof typeof tempTitles]
    : MISSING_THERMOSTAT_TYPE_TEMPERATURE_TITLE;

  const setpointTitle = thermostatType
    ? setpointTitles[thermostatType as keyof typeof setpointTitles]
    : MISSING_THERMOSTAT_TYPE_SETPOINT_TITLE;

  const tempValue =
    thermostatType && get(chResults, tempValues[thermostatType]);
  const setpointValue =
    thermostatType && get(chResults, setpointValues[thermostatType]);
  const setpointAdherenceValue =
    thermostatType && get(chResults, setpointAdherenceValues[thermostatType]);

  return (
    <>
      <DetailBlock
        title={tempTitle}
        value={tempValue}
        unitSuffix={UnitSuffix.DEGREES_CELSIUS}
      />
      <DetailBlock
        title={setpointTitle}
        value={setpointValue}
        unitSuffix={UnitSuffix.DEGREES_CELSIUS}
      />
      <DetailBlock
        title="Setpoint reached"
        value={roundNumber(setpointAdherenceValue ?? undefined, 1)}
        unitSuffix={UnitSuffix.PERCENTAGE}
      />
    </>
  );
}

export default InstallationDetailTemperatureDetails;
