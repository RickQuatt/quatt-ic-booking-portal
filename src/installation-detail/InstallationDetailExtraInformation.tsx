import { AdminInstallationDetail } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { CICDetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { formatDateDistance } from "../utils/formatDate";

export function InstallationDetailExtraInformation({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="🔍 Extra information" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Active CIC</FormFieldTitle>
          <FormFieldValue value={installation.cicState[0].cicId} />
        </FormField>
        <FormField>
          <FormFieldTitle>Quatt build</FormFieldTitle>
          <FormFieldValue value={installation.quattBuild} />
        </FormField>
        <FormField>
          <FormFieldTitle>Last connection</FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(
              installation.lastConnectionStatusUpdatedAt,
            )}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Installation date</FormFieldTitle>
          <FormFieldValue value={installation.createdAt.toISOString()} />
        </FormField>
      </FormSection>
    </div>
  );
}
