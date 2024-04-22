import { Link } from "wouter";
import {
  AdminInstallationDetail,
  ServiceJob,
  TarrifsResult,
  Ticket,
} from "../api-client/models";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import classes from "./InstallationDetail.module.css";
import { ButtonLink } from "../ui-components/button/Button";
import { InstallationDetailExtraInformation } from "./InstallationDetailExtraInformation";
import { InstallationDetailCicHistory } from "./InstallationDetailCicHistory";
import { InstallationDetailCommissioningHistory } from "./InstallationDetailCommissioningHistory";
import { InstallationDetailAdvanced } from "./InstallationDetailAdvanced";
import { InstallationDetailSettings } from "./InstallationDetailSettings";
import { InstallationDetailSettingsHistory } from "./InstallationDetailSettingsHistory";
import { InstallationDetailService } from "./InstallationDetailService";
import { InstallationDetailTickets } from "./InstallationDetailTickets";
import { InstallationDetailTariff } from "./InstallationDetailTariff";

interface InstallationDetailProps {
  data: AdminInstallationDetail;
  hubspotTickets: Ticket[] | null;
  zuperJobs: ServiceJob[] | null;
  tariff: TarrifsResult | null;
}

export function InstallationDetail({
  data,
  hubspotTickets,
  zuperJobs,
  tariff,
}: InstallationDetailProps) {
  if (!data.externalId) {
    return <span>No externalId included for this installation 🚨</span>;
  }

  return (
    <div className={classes["detail-sections"]}>
      <div className={classes["detail-sections-health"]}>
        <div className={classes["detail-section-header"]}>
          {data.orderNumber ?? "No order number 😵"}
        </div>

        <div className={classes["detail-section"]}>
          <DetailSectionHeader title="🏥 Health checks" />
          TODO
        </div>

        <div className={classes["detail-section"]}>
          <DetailSectionHeader title="📝 Notes" />
          TODO
        </div>

        <InstallationDetailExtraInformation installation={data} />
        <InstallationDetailCicHistory installation={data} />
        <InstallationDetailCommissioningHistory installation={data} />
      </div>

      <div className={classes["detail-sections-insights"]}>
        <InstallationDetailAdvanced installation={data} />
        <InstallationDetailSettingsHistory installation={data} />
        <InstallationDetailSettings installation={data} />
      </div>

      <div className={classes["detail-sections-api"]}>
        <InstallationDetailTickets hubspotTickets={hubspotTickets} />
        <InstallationDetailService zuperJobs={zuperJobs} />
        <InstallationDetailTariff
          tariff={tariff}
          installationId={data.externalId}
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
