import { AdminInstallationDetail, ServiceJob } from "../api-client/models";
import { FormField, FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import React, { useEffect } from "react";
import getService, { GetServiceData } from "../api-client/zuper";
import { formatDateTimeString } from "../utils/formatDate";
import zuperLogo from "../../images/ZuperPro.webp";

interface CICDetailProps {
  installation: AdminInstallationDetail;
  zuperJobs: ServiceJob[] | null;
}

export function InstallationDetailService({
  installation,
  zuperJobs,
}: CICDetailProps) {
  const [service, setService] = React.useState<GetServiceData>();

  useEffect(() => {
    getService(installation.orderNumber).then((data) => setService(data));
  }, [installation]);

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader logo={zuperLogo} title="Services" />
      <FormSection>
        <FormField>
          {service &&
            service.data.map((s) => (
              <div
                style={{ cursor: "pointer" }}
                className={classes["detail-section"]}
                key={s.job_uid}
                onClick={() =>
                  window.open(
                    `https://app.zuperpro.com/jobs/${s.job_uid}/details`,
                  )
                }
              >
                <div className={classes["detail-section-bold"]}>
                  {s.job_title}
                </div>
                <div>
                  {`Installer: ${[
                    s.assigned_to[0].user.first_name,
                    s.assigned_to[0].user.last_name,
                  ]
                    .join(" ")
                    .trim()}`}
                </div>
                <div>{`Status: ${s.current_job_status.status_name}`}</div>
                <div>{`End time: ${
                  formatDateTimeString(s.actual_end_time) || "N/A"
                }`}</div>
              </div>
            ))}
          {service && service.data.length === 0 && (
            <div style={{ textAlign: "center" }}>No services 👍</div>
          )}
        </FormField>
      </FormSection>
    </div>
  );
}
