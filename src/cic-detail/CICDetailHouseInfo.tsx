import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldJson,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import { formatDate, formatDateDistance } from "../utils/formatDate";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailHouseInfo({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="House info" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Street name</FormFieldTitle>
          <FormFieldValue value={cicData.addressStreet} />
        </FormField>
        <FormField>
          <FormFieldTitle>House number</FormFieldTitle>
          <FormFieldValue value={cicData.addressNumber} />
        </FormField>
        <FormField>
          <FormFieldTitle>ZIP code</FormFieldTitle>
          <FormFieldValue value={cicData.zipCode} />
        </FormField>
      </FormSection>
    </div>
  );
}
