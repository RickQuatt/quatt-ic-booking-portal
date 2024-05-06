import { AdminInstallationDetail } from "../api-client/models";
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

export function InstallationDetailAdvanced({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="📊 Advanced insights" />
      <FormSection>
        <ButtonLink
          href={
            installation.orderNumber
              ? getHubspotSearchOrderLink(installation.orderNumber)
              : undefined
          }
          target="_blank"
          disabled={!installation.orderNumber}
        >
          Hubspot Search Order
        </ButtonLink>
        {installation.menderId && (
          <ButtonLink
            href={getMenderLink(installation.menderId)}
            target="_blank"
          >
            Mender
          </ButtonLink>
        )}
        <ButtonLink
          href={getGrafanaDataPerCICLink(installation.activeCic)}
          target="_blank"
        >
          Grafana - Data per CIC
        </ButtonLink>
        <ButtonLink
          href={getGrafanaDiagnosticsLink(installation.activeCic)}
          target="_blank"
        >
          Grafana - Diagnostics
        </ButtonLink>
      </FormSection>
    </div>
  );
}
