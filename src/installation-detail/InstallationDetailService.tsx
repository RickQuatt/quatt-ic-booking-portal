import { formatDateTime } from "../utils/formatDate";
import { FormField, FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import zuperLogo from "../../images/ZuperPro.webp";
import { useQuery } from "react-query";
import { useApiClient } from "../api-client/context";
import { Loader } from "../ui-components/loader/Loader";

interface InstallationDetailServiceProps {
  installationId: string;
}

export function InstallationDetailService({
  installationId,
}: InstallationDetailServiceProps) {
  const apiClient = useApiClient();

  const { data: zuperData, status: zuperStatus } = useQuery(
    ["installationZuperJobs", installationId],
    () => {
      return apiClient.adminGetInstallationZuperJobs({
        installationId: installationId,
      });
    },
  );
  const zuperJobs = zuperData?.result;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader logo={zuperLogo} title="Services" />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {zuperStatus === "error" && (
              <div style={{ textAlign: "center" }}>No services 👍</div>
            )}
            {zuperStatus === "loading" ? (
              <Loader />
            ) : (
              <>
                {zuperJobs &&
                  zuperJobs.services.map((service) => (
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
                {zuperJobs && zuperJobs.services.length === 0 && (
                  <div style={{ textAlign: "center" }}>No services 👍</div>
                )}
              </>
            )}
          </div>
        </FormField>
      </FormSection>
    </div>
  );
}
