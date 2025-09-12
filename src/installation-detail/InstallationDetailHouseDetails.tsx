import { AdminInstallationDetail } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";

export function InstallationDetailHouseDetails({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  const { zipCode, houseNumber, houseAddition } = installation;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="🏠 House Details" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Zip Code</FormFieldTitle>
          <FormFieldValue value={zipCode} />
        </FormField>
        <FormField>
          <FormFieldTitle>House Number</FormFieldTitle>
          <FormFieldValue value={houseNumber} />
        </FormField>
        {houseAddition && (
          <FormField>
            <FormFieldTitle>House Number Addition</FormFieldTitle>
            <FormFieldValue value={houseAddition} />
          </FormField>
        )}
      </FormSection>
    </div>
  );
}
