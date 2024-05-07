import { AdminInstallationDetail } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { formatDateDistance, formatDateTimeString } from "../utils/formatDate";

export function InstallationDetailExtraInformation({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="🔍 Extra information" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Active CIC</FormFieldTitle>
          <FormFieldValue value={installation.activeCic} />
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
          <FormFieldValue
            value={
              installation.installedAt
                ? formatDateTimeString(installation.installedAt.toISOString())
                : "N/A"
            }
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Installation type</FormFieldTitle>
          <FormFieldValue
            value={
              installation.installationType === "hybrid"
                ? "Quatt Hybrid"
                : "Quatt Hybrid Duo"
            }
          />
        </FormField>
      </FormSection>
    </div>
  );
}
