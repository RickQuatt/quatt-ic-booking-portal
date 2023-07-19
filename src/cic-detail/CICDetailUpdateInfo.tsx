import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import { formatDate } from "../utils/formatDate";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailUpdateInfo({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Update info" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Quatt build</FormFieldTitle>
          <FormFieldValue value={cicData.quattBuild} />
        </FormField>
        <FormField>
          <FormFieldTitle>Quatt build required</FormFieldTitle>
          <FormFieldValue value={cicData.quattBuildRequired} />
        </FormField>
        <FormField>
          <FormFieldTitle>Update status</FormFieldTitle>
          <FormFieldValue value={cicData.updateStatus} />
        </FormField>
        <FormField>
          <FormFieldTitle>Needs update</FormFieldTitle>
          <FormFieldValue value={cicData.needsUpdate} />
        </FormField>
        <FormField>
          <FormFieldTitle>Update until</FormFieldTitle>
          <FormFieldValue value={formatDate(cicData.updateUntil)} />
        </FormField>
        <FormField>
          <FormFieldTitle>Mender ID</FormFieldTitle>
          <FormFieldValue value={cicData.menderId} />
        </FormField>
        <FormField>
          <FormFieldTitle>Mender update status</FormFieldTitle>
          <FormFieldValue value={cicData.menderUpdateState} />
        </FormField>
      </FormSection>
    </div>
  );
}
