import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { DetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailBoilerInfo({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Boiler info" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Is boiler connected</FormFieldTitle>
          <FormFieldValue value={cicData.isBoilerConnected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is boiler on</FormFieldTitle>
          <FormFieldValue value={cicData.boilerOn} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler type</FormFieldTitle>
          <FormFieldValue value={cicData.boilerType} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler power</FormFieldTitle>
          <FormFieldValue value={cicData.boilerPower} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler pressure</FormFieldTitle>
          <FormFieldValue value={cicData.boilerPressure} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler water temperature in</FormFieldTitle>
          <FormFieldValue value={cicData.boilerWaterTemperatureIn} />
        </FormField>
        <FormField>
          <FormFieldTitle>Boiler water temperature out</FormFieldTitle>
          <FormFieldValue value={cicData.boilerWaterTemperatureOut} />
        </FormField>
      </FormSection>
    </div>
  );
}
