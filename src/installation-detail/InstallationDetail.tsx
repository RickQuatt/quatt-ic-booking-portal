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
import { InstallationDetailTariff } from "./InstallationDetailTariff";
import { InstallationDetailService } from "./InstallationDetailService";
import { InstallationHealthChecks } from "./InstallationHealthChecks";

interface InstallationDetailProps {
  data: AdminInstallationDetail;
  tariff: TarrifsResult | null;
}

export function InstallationDetail({ data, tariff }: InstallationDetailProps) {
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

        <div className={classes["detail-section"]}>
          <DetailSectionHeader title="📝 Notes" />
          TODO
        </div>

        <InstallationDetailExtraInformation installation={data} />
        <InstallationDetailCicHistory installation={data} />
        <InstallationDetailCommissioningHistory
          installationId={installationId}
          installation={data}
        />
      </div>

      <div className={classes["detail-sections-insights"]}>
        <InstallationDetailAdvanced installation={data} />
        <InstallationDetailSettingsHistory installation={data} />
        <InstallationDetailSettings installation={data} />
      </div>

      <div className={classes["detail-sections-api"]}>
        <InstallationDetailTickets installationId={installationId} />
        <InstallationDetailService installationId={installationId} />
        <InstallationDetailTariff
          tariff={tariff}
          installationId={installationId}
        />
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
