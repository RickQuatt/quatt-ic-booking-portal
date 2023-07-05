import { AdminCic } from "../api-client/models";
import { FormField, FormFieldJson, FormFieldTitle, FormFieldValue, FormSection } from "../ui-components/form/Form";
import { formatDate, formatDateDistance } from "../utils/formatDate";
import classes from "./CICDetail.module.css";

export function CICDetailExtra({
  cicData
}: {
  cicData: AdminCic
}) {
  return (
    <div className={classes["detail-section"]}>
      <h3>CIC Details Extra</h3>
      <FormSection>
        <FormField>
          <FormFieldTitle>Quatt build</FormFieldTitle>
          <FormFieldValue value={cicData.quattBuild} />
        </FormField>
        <FormField>
          <FormFieldTitle>
            Last connection status updated at
          </FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(cicData.lastConnectionStatusUpdatedAt)}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler power</FormFieldTitle>
          <FormFieldValue value={cicData.boilerPower} />
        </FormField>
        <FormField>
          <FormFieldTitle>Cable connection status</FormFieldTitle>
          <FormFieldValue value={cicData.cableConnectionStatus} />
        </FormField>
        <FormField>
          <FormFieldTitle>Flow rate</FormFieldTitle>
          <FormFieldValue value={cicData.flowRate} />
        </FormField>
        <FormField>
          <FormFieldTitle>LTE connection status</FormFieldTitle>
          <FormFieldValue value={cicData.lteConnectionStatus} />
        </FormField>
        <FormField>
          <FormFieldTitle>Wifi connection status</FormFieldTitle>
          <FormFieldValue value={cicData.wifiConnectionStatus} />
        </FormField>
        <FormField>
          <FormFieldTitle>Wifi SSID</FormFieldTitle>
          <FormFieldValue value={cicData.wifiSSID} />
        </FormField>
        <FormField>
          <FormFieldTitle>Electricity price</FormFieldTitle>
          <FormFieldValue value={cicData.electricityPrice} />
        </FormField>
        <FormField>
          <FormFieldTitle>Day electricity price</FormFieldTitle>
          <FormFieldValue value={cicData.dayElectricityPrice} />
        </FormField>
        <FormField>
          <FormFieldTitle>Night electricity price</FormFieldTitle>
          <FormFieldValue value={cicData.nightElectricityPrice} />
        </FormField>
        <FormField>
          <FormFieldTitle>Gas price</FormFieldTitle>
          <FormFieldValue value={cicData.gasPrice} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler demand</FormFieldTitle>
          <FormFieldValue value={cicData.boilerDemand} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler water temperature in</FormFieldTitle>
          <FormFieldValue value={cicData.boilerWaterTemperatureIn} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler water temperature out</FormFieldTitle>
          <FormFieldValue value={cicData.boilerWaterTemperatureOut} />
        </FormField>
        <FormField>
          <FormFieldTitle>
            Thermostat control temperature set point
          </FormFieldTitle>
          <FormFieldValue
            value={cicData.thermostatControlTemperatureSetPoint}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Thermostat demand</FormFieldTitle>
          <FormFieldValue value={cicData.thermostatDemand} />
        </FormField>
        <FormField>
          <FormFieldTitle>Thermostat room temperature</FormFieldTitle>
          <FormFieldValue value={cicData.thermostatRoomTemperature} />
        </FormField>
        <FormField>
          <FormFieldTitle>Serial</FormFieldTitle>
          <FormFieldValue value={cicData.serial} />
        </FormField>
        <FormField>
          <FormFieldTitle>Supervisory control mode</FormFieldTitle>
          <FormFieldValue value={cicData.supervisoryControlMode} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is HP1 connected</FormFieldTitle>
          <FormFieldValue value={cicData.isHp1Connected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is thermostat connected</FormFieldTitle>
          <FormFieldValue value={cicData.isThermostatConnected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is boiler connected</FormFieldTitle>
          <FormFieldValue value={cicData.isBoilerConnected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is temperature sensor connected</FormFieldTitle>
          <FormFieldValue value={cicData.isTemperatureSensorConnected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is controller alive</FormFieldTitle>
          <FormFieldValue value={cicData.isControllerAlive} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler type</FormFieldTitle>
          <FormFieldValue value={cicData.boilerType} />
        </FormField>
        <FormField>
          <FormFieldTitle>Zip code</FormFieldTitle>
          <FormFieldValue value={cicData.zipCode} />
        </FormField>
        <FormField>
          <FormFieldTitle>Last commissioning completed at</FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(cicData.lastConnectionStatusUpdatedAt)}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Thermostat type</FormFieldTitle>
          <FormFieldValue value={cicData.thermostatType} />
        </FormField>
        <FormField>
          <FormFieldTitle>Rated maximum house power</FormFieldTitle>
          <FormFieldValue value={cicData.ratedMaximumHousePower} />
        </FormField>
        <FormField>
          <FormFieldTitle>
            Maximum heating outdoor temperature
          </FormFieldTitle>
          <FormFieldValue
            value={cicData.maximumHeatingOutdoorTemperature}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Last commissioning</FormFieldTitle>
          <FormFieldJson value={cicData.lastCommissioning} />
        </FormField>
        <FormField>
          <FormFieldTitle>Created at</FormFieldTitle>
          <FormFieldValue value={formatDate(cicData.createdAt)} />
        </FormField>
        <FormField>
          <FormFieldTitle>Mender ID</FormFieldTitle>
          <FormFieldValue value={cicData.menderId} />
        </FormField>
      </FormSection>
    </div>
  )
}