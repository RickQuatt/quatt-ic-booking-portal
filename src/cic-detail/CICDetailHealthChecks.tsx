import React from "react";
import { AdminCic, CicHealthCheckCategory } from "../api-client/models";
import classes from "./CICDetail.module.css";
import {
  DetailSectionHeader,
  DetailSubSectionHeader,
} from "./CICDetailSectionHeader";
import {
  FormField,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import { getEntries } from "../utils/object";
import { HealthCheckCircle } from "../cic-health-list/HealthCheckCircle";
import { categoryToLabel, kpiToLabel } from "../constants";
import { groupBy } from "lodash-es";

export function CICDetailHealthChecks({ cicData }: { cicData: AdminCic }) {
  const entriesByCategory = React.useMemo(() => {
    return groupBy(
      getEntries(cicData.healthChecksByKpi),
      ([kpi, value]) => value.category,
    );
  }, [cicData.healthChecksByKpi]);

  const rows = React.useMemo(() => {
    return getEntries(entriesByCategory).map(([category, entries], index) => {
      const rows = entries.map(([kpi, value], index) => {
        return (
          <FormField key={index}>
            <FormFieldTitle>{kpiToLabel[kpi]}</FormFieldTitle>
            <HealthCheckCircle status={value.status} />
          </FormField>
        );
      });

      return (
        <>
          <DetailSubSectionHeader
            key={index}
            title={categoryToLabel[category as CicHealthCheckCategory]}
          />
          {rows}
        </>
      );
    });
  }, [entriesByCategory]);

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Health checks" />
      <FormSection>{rows}</FormSection>
    </div>
  );
}
