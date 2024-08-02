import { AdminInstallationDetail, ZuperService } from "../api-client/models";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import {
  getGrafanaDataPerCICLink,
  getGrafanaDiagnosticsLink,
  getHubspotSearchOrderLink,
  getMenderLink,
} from "../cic-detail/getLinks";
import { ButtonLink } from "../ui-components/button/Button";
import { FormSection } from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { InstallationDetailZuperButtonGroup } from "./InstallationDetailZuperButtonGroup";

export function InstallationDetailAdvanced({
  installation,
  zuperInstallationJobs,
  isLoadingZuperJobs,
}: {
  installation: AdminInstallationDetail;
  zuperInstallationJobs?: ZuperService[];
  isLoadingZuperJobs: boolean;
}) {
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
        <InstallationDetailZuperButtonGroup
          zuperInstallationJobs={zuperInstallationJobs}
          isLoadingJobs={isLoadingZuperJobs}
        />
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
