import { useQuery } from "react-query";
import { AdminInstallationDetail } from "../api-client/models";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import {
  getGrafanaDataPerCICLink,
  getGrafanaDiagnosticsLink,
  getHubspotSearchOrderLink,
  getMenderLink,
  getZuperJobLink,
} from "../cic-detail/getLinks";
import { ButtonLink } from "../ui-components/button/Button";
import { FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { useApiClient } from "../api-client/context";

export function InstallationDetailAdvanced({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  const apiClient = useApiClient();
  const { data: zuperData } = useQuery(
    ["installationZuperServices", installation],
    () => {
      return apiClient.adminGetInstallationZuperJobs({
        installationId: installation.externalId as string,
      });
    },
  );
  const zuperJobs = zuperData?.result;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="📊 Advanced insights" />
      <FormSection>
        <ButtonLink
          href={getGrafanaDiagnosticsLink(installation.activeCic)}
          target="_blank"
        >
          Grafana - Diagnostics
        </ButtonLink>
        <ButtonLink
          href={zuperJobs?.job_uid && getZuperJobLink(zuperJobs?.job_uid)}
          target="_blank"
          disabled={!zuperJobs?.job_uid}
        >
          Zuper - Job
        </ButtonLink>
        <ButtonLink
          href={
            installation.orderNumber
              ? getHubspotSearchOrderLink(installation.orderNumber)
              : undefined
          }
          target="_blank"
          disabled={!installation.orderNumber}
        >
          Hubspot - Deals
        </ButtonLink>
        <ButtonLink
          href={getGrafanaDataPerCICLink(installation.activeCic)}
          target="_blank"
        >
          Grafana - Data per CIC
        </ButtonLink>
        {installation.menderId && (
          <ButtonLink
            href={getMenderLink(installation.menderId)}
            target="_blank"
          >
            Mender
          </ButtonLink>
        )}
      </FormSection>
    </div>
  );
}
