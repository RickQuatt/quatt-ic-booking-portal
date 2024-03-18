import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { DetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailExtra({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Extra details" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Heat delivery systems</FormFieldTitle>
          <FormFieldValue value={cicData.heatDeliverySystems?.join(", ")} />
        </FormField>
        <FormField>
          <FormFieldTitle>Flow rate</FormFieldTitle>
          <FormFieldValue value={cicData.flowRate} />
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
          <FormFieldTitle>Is temperature sensor connected</FormFieldTitle>
          <FormFieldValue value={cicData.isTemperatureSensorConnected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is controller alive</FormFieldTitle>
          <FormFieldValue value={cicData.isControllerAlive} />
        </FormField>
      </FormSection>
    </div>
  );
}
