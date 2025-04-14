import {
  AdminInstallationDetail,
  InstallationType,
  ZuperService,
} from "../api-client/models";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import {
  getGrafanaAllEDashboardLink,
  getGrafanaDataPerCICLink,
  getGrafanaDiagnosticsLink,
  getHubspotDealLink,
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
  const { activeCic, hubspotDealId, menderId } = installation;
  const hubspotDealLink = getHubspotDealLink(hubspotDealId);
  const hubspotDealText = hubspotDealLink
    ? "Hubspot - Deal"
    : "Hubspot - No deal";

  if (!activeCic) {
    throw new Error("Active CIC not found");
  }
  const isAllElectric =
    installation.installationType === InstallationType.AllElectric ||
    installation.installationType === InstallationType.AllElectricDuo;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="📊 Advanced insights" />
      <FormSection>
        <ButtonLink href={getGrafanaDiagnosticsLink(activeCic)} target="_blank">
          Grafana - Diagnostics
        </ButtonLink>
        <InstallationDetailZuperButtonGroup
          zuperInstallationJobs={zuperInstallationJobs}
          isLoadingJobs={isLoadingZuperJobs}
        />
        <ButtonLink
          href={hubspotDealLink}
          target="_blank"
          disabled={!hubspotDealLink}
        >
          {hubspotDealText}
        </ButtonLink>
        <ButtonLink href={getGrafanaDataPerCICLink(activeCic)} target="_blank">
          Grafana - Data per CIC
        </ButtonLink>
        <ButtonLink
          href={
            isAllElectric ? getGrafanaAllEDashboardLink(activeCic) : undefined
          }
          target="_blank"
          disabled={!isAllElectric}
        >
          Grafana - All E Dashboard
        </ButtonLink>
        {menderId && (
          <ButtonLink href={getMenderLink(menderId)} target="_blank">
            Mender
          </ButtonLink>
        )}
      </FormSection>
    </div>
  );
}
