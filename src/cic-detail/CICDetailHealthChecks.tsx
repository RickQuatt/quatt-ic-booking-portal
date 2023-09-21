import React from "react";
import { AdminCic } from "../api-client/models";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";
import {
  FormField,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import { getEntries } from "../utils/object";
import { HealthCheckCircle } from "../cic-health-list/HealthCheckCircle";
import { kpiToLabel } from "../constants";

export function CICDetailHealthChecks({ cicData }: { cicData: AdminCic }) {
  const rows = React.useMemo(() => {
    return getEntries(cicData.healthChecksByKpi).map(([kpi, value]) => {
      return (
        <FormField key={kpi}>
          <FormFieldTitle>{kpiToLabel[kpi]}</FormFieldTitle>
          <HealthCheckCircle status={value.status} />
        </FormField>
      );
    });
  }, [cicData.healthChecksByKpi]);

  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Health checks" />
      <FormSection>{rows}</FormSection>
    </div>
  );
}
