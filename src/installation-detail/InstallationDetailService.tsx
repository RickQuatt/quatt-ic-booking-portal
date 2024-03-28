import { formatDate } from "../utils/formatDate";
import { ServiceJob } from "../api-client/models";
import { FormField, FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import zuperLogo from "../../images/ZuperPro.webp";

interface CICDetailProps {
  zuperJobs: ServiceJob[] | null;
}

export function InstallationDetailService({ zuperJobs }: CICDetailProps) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader logo={zuperLogo} title="Services" />
      <FormSection>
        <FormField>
          {zuperJobs &&
            zuperJobs.map((service) => (
              <div
                style={{ cursor: "pointer" }}
                className={classes["detail-section"]}
                key={service.job_uid}
                onClick={() =>
                  window.open(
                    `https://app.zuperpro.com/jobs/${service.job_uid}/details`,
                  )
                }
              >
                <div className={classes["detail-section-bold"]}>
                  {service.job_title}
                </div>
                <div>{`Installer: ${service.installer}`}</div>
                <div>{`Status: ${service.status_name}`}</div>
                <div>{`End time: ${
                  formatDate(service.actual_end_time) || "N/A"
                }`}</div>
              </div>
            ))}
          {zuperJobs && zuperJobs.length === 0 && (
            <div style={{ textAlign: "center" }}>No services 👍</div>
          )}
        </FormField>
      </FormSection>
    </div>
  );
}
