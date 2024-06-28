import { Link } from "wouter";
import { AdminInstallationDetail, TarrifsResult } from "../api-client/models";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import classes from "./InstallationDetail.module.css";
import { ButtonLink } from "../ui-components/button/Button";
import { InstallationDetailExtraInformation } from "./InstallationDetailExtraInformation";
import { InstallationDetailCicHistory } from "./InstallationDetailCicHistory";
import { InstallationDetailCommissioningHistory } from "./InstallationDetailCommissioningHistory";
import { InstallationDetailAdvanced } from "./InstallationDetailAdvanced";
import { InstallationDetailSettings } from "./InstallationDetailSettings";
import { InstallationDetailSettingsHistory } from "./InstallationDetailSettingsHistory";
import { InstallationDetailTickets } from "./InstallationDetailTickets";
import { InstallationDetailZuperService } from "./InstallationDetailZuperService";
import { InstallationHealthChecks } from "./InstallationHealthChecks";
import { InstallationDetailNotes } from "./installationDetailNotes";

interface InstallationDetailProps {
  data: AdminInstallationDetail;
}

export function InstallationDetail({ data }: InstallationDetailProps) {
  const installationId = data.externalId;

  if (!installationId) {
    return <span>No installationId included for this installation 🚨</span>;
  }

  return (
    <div className={classes["detail-sections"]}>
      <div className={classes["detail-sections-health"]}>
        <div className={classes["detail-section-header"]}>
          {data.orderNumber ?? "No order number 😵"}
        </div>

        <div className={classes["detail-section"]}>
          <DetailSectionHeader title="🏥 Health checks" />
          <InstallationHealthChecks installationId={installationId} />
        </div>

        <InstallationDetailNotes installationId={installationId} />
        <InstallationDetailExtraInformation installation={data} />
        <InstallationDetailCicHistory installation={data} />
        <InstallationDetailCommissioningHistory
          installationId={installationId}
          installation={data}
        />
      </div>

      <div className={classes["detail-sections-insights"]}>
        <InstallationDetailAdvanced installation={data} />
        <InstallationDetailSettingsHistory
          installationId={installationId}
          installation={data}
        />
        <InstallationDetailSettings installation={data} />
      </div>

      <div className={classes["detail-sections-api"]}>
        <InstallationDetailTickets installationId={installationId} />
        <InstallationDetailZuperService installationId={installationId} />
        {/* TODO Uncomment when feature is live on production
        https://linear.app/quatt/issue/SUP-122/enable-historic-tariffs-when-the-feature-is-live-on-production
        */}
        {/* <InstallationDetailTariff
          tariff={tariff}
          installationId={installationId}
        /> */}
      </div>

      <BackButton />
    </div>
  );
}

function BackButton() {
  return (
    <Link href={`/installations`} className={classes["back-button"]}>
      <ButtonLink className={classes["back-button"]}>
        ← Back to installations
      </ButtonLink>
    </Link>
  );
}
