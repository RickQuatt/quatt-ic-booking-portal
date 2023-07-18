import { AdminCic } from "../api-client/models";
import { FormField, FormFieldTitle, FormFieldValue, FormSection } from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailThermostatInfo({
  cicData
}: {
  cicData: AdminCic
}) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Thermostat info" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Is thermostat connected</FormFieldTitle>
          <FormFieldValue value={cicData.isThermostatConnected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Thermostat type</FormFieldTitle>
          <FormFieldValue value={cicData.thermostatType} />
        </FormField>
        <FormField>
          <FormFieldTitle>Thermostat demand</FormFieldTitle>
          <FormFieldValue value={cicData.thermostatDemand} />
        </FormField>
        <FormField>
          <FormFieldTitle>Thermostat flame on</FormFieldTitle>
          <FormFieldValue value={cicData.thermostatFlameOn} />
        </FormField>
        <FormField>
          <FormFieldTitle>Show thermostat temperatures</FormFieldTitle>
          <FormFieldValue value={cicData.showThermostatTemperatures} />
        </FormField>
        <FormField>
          <FormFieldTitle>Thermostat room temperature</FormFieldTitle>
          <FormFieldValue value={cicData.thermostatRoomTemperature} />
        </FormField>
        <FormField>
          <FormFieldTitle>
            Thermostat control temperature set point
          </FormFieldTitle>
          <FormFieldValue
            value={cicData.thermostatControlTemperatureSetPoint}
          />
        </FormField>
      </FormSection>
    </div>
  )
}