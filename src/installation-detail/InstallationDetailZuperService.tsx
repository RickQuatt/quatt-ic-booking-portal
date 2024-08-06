import { formatDateTime } from "../utils/formatDate";
import { FormField, FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import zuperLogo from "../../images/ZuperPro.webp";
import { Loader } from "../ui-components/loader/Loader";
import { ZuperService } from "../api-client/models";
import { QueryObserverResult } from "@tanstack/react-query";
import ErrorText from "../ui-components/error-text/ErrorText";

interface InstallationDetailServiceProps {
  zuperServiceJobs?: ZuperService[];
  isLoadingJobs: boolean;
  zuperJobsError?: unknown;
  refetch: () => Promise<QueryObserverResult<unknown, Error>>;
}

export function InstallationDetailZuperService({
  zuperServiceJobs,
  isLoadingJobs,
  zuperJobsError,
  refetch,
}: InstallationDetailServiceProps) {
  const noServiceJobsToShow =
    !isLoadingJobs && (!zuperServiceJobs?.length || !!zuperJobsError);

  if (zuperJobsError) {
    return (
      <ErrorText
        text="Failed to fetch Zuper services for the installation."
        retry={refetch}
      />
    );
  }

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
                {zuperServiceJobs?.map((service) => (
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
