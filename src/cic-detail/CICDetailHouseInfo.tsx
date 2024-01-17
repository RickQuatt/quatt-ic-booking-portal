import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailHouseInfo({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="House info" />
      <FormSection>
        <FormField>
          <FormFieldTitle>ZIP code</FormFieldTitle>
          <FormFieldValue value={cicData.zipCode} />
        </FormField>
      </FormSection>
    </div>
  );
}
