import { Link } from "wouter";
import {
  AdminInstallationDetail,
  ServiceJob,
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

interface InstallationDetailProps {
  data: AdminInstallationDetail;
  hubsoptTickets: Ticket[] | null;
  zuperJobs: ServiceJob[] | null;
}

export function InstallationDetail({
  data,
  hubsoptTickets,
  zuperJobs,
}: InstallationDetailProps) {
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
        <div className={classes["detail-section"]}>
          <DetailSectionHeader title="Hubspot tickets" />
          TODO
        </div>
        <InstallationDetailService installation={data} zuperJobs={zuperJobs} />
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
