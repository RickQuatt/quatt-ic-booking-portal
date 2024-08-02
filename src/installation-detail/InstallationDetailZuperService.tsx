import { formatDateTime } from "../utils/formatDate";
import { FormField, FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import zuperLogo from "../../images/ZuperPro.webp";
import { Loader } from "../ui-components/loader/Loader";
import { ZuperService } from "../api-client/models";

interface InstallationDetailServiceProps {
  zuperServiceJobs?: ZuperService[];
  isLoadingJobs: boolean;
  zuperJobsError?: unknown;
}

export function InstallationDetailZuperService({
  zuperServiceJobs,
  isLoadingJobs,
  zuperJobsError,
}: InstallationDetailServiceProps) {
  const noServiceJobsToShow =
    !isLoadingJobs && (!zuperServiceJobs?.length || !!zuperJobsError);

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader logo={zuperLogo} title="Services" />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {noServiceJobsToShow && (
              <div style={{ textAlign: "center" }}>No services 👍</div>
            )}
            {isLoadingJobs ? (
              <Loader />
            ) : (
              <>
                {zuperServiceJobs &&
                  zuperServiceJobs.map((service) => (
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
                      <div>{`Updated at: ${
                        formatDateTime(service.updated_at) || "N/A"
                      }`}</div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </FormField>
      </FormSection>
    </div>
  );
}
