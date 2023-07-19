import React from "react";
import { AdminCic, HeatPumpCommissioning } from "../api-client/models";
import {
  FormField,
  FormFieldJson,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import { formatDateDistance } from "../utils/formatDate";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailLastCommissioning({
  data,
}: {
  data: AdminCic["lastCommissioning"];
}) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Last commissioning" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Completed at</FormFieldTitle>
          <FormFieldValue value={formatDateDistance(data.completedAt)} />
        </FormField>
        <FormField>
          <FormFieldTitle>Last commissioning</FormFieldTitle>
          <FormFieldJson value={data} />
        </FormField>
      </FormSection>
    </div>
  );
}
