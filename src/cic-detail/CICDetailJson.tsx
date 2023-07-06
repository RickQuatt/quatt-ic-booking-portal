import { AdminCic } from "../api-client/models";
import { FormField, FormFieldJson, FormFieldTitle, FormSection } from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";

export function CICDetailJson({
  cicData
}: {
  cicData: AdminCic
}) {
  return (
    <div className={classes["detail-section"]}>
      <h3>Raw JSON</h3>
      <FormSection>
        <FormField>
          <FormFieldJson value={cicData} />
        </FormField>
      </FormSection>
    </div>
  )
}