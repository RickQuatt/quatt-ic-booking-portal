import { AdminCic } from "../api-client/models";
import { FormField, FormFieldJson, FormFieldTitle, FormFieldValue, FormSection } from "../ui-components/form/Form";
import { formatDate, formatDateDistance } from "../utils/formatDate";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailExtra({
  cicData
}: {
  cicData: AdminCic
}) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Extra details" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Created at</FormFieldTitle>
          <FormFieldValue value={formatDate(cicData.createdAt)} />
        </FormField>
        <FormField>
          <FormFieldTitle>Flow rate</FormFieldTitle>
          <FormFieldValue value={cicData.flowRate} />
        </FormField>
        <FormField>
          <FormFieldTitle>Supply temperature</FormFieldTitle>
          <FormFieldValue value={cicData.supplyTemperature} />
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
        <FormField>
          <FormFieldTitle>Last commissioning completed at</FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(cicData.lastConnectionStatusUpdatedAt)}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Last commissioning</FormFieldTitle>
          <FormFieldJson value={cicData.lastCommissioning} />
        </FormField>
        <FormField>
          <FormFieldTitle>Mender update status</FormFieldTitle>
          <FormFieldValue value={cicData.menderUpdateState} />
        </FormField>
      </FormSection>
    </div>
  )
}