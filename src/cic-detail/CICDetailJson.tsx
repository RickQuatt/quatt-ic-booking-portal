import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldJson,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailJson({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Raw JSON response" />
      <FormSection>
        <FormField>
          <FormFieldJson value={cicData} />
        </FormField>
      </FormSection>
    </div>
  );
}
