import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldJson,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { DetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailJson({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Raw JSON response" />
      <FormSection>
        <FormField>
          <FormFieldJson value={cicData} />
        </FormField>
      </FormSection>
    </div>
  );
}
