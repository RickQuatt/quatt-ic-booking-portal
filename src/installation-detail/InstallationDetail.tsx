import { Link } from "wouter";
import { AdminInstallationDetail } from "../api-client/models";
import { CICDetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import classes from "./InstallationDetail.module.css";
import { ButtonLink } from "../ui-components/button/Button";
import { InstallationDetailExtraInformation } from "./InstallationDetailExtraInformation";

interface InstallationDetailProps {
  data: AdminInstallationDetail;
}

export function InstallationDetail({ data }: InstallationDetailProps) {
  return (
    <div className={classes["detail-sections"]}>
      <div className={classes["detail-sections-health"]}>
        <div className={classes["detail-section-header"]}>
          {data.orderNumber ?? "No order number 😵"}
        </div>

        <div className={classes["detail-section"]}>
          <CICDetailSectionHeader title="🏥 Health checks" />
          TODO
        </div>

        <div className={classes["detail-section"]}>
          <CICDetailSectionHeader title="📝 Notes" />
          TODO
        </div>

        <InstallationDetailExtraInformation installation={data} />
      </div>

      <div className={classes["detail-sections-insights"]}>
        <div className={classes["detail-section"]}>
          <CICDetailSectionHeader title="📊 Advanced insights" />
          TODO
        </div>
      </div>

      <div className={classes["detail-sections-api"]}>
        <div className={classes["detail-section"]}>
          <CICDetailSectionHeader title="Hubspot tickets" />
          TODO
        </div>
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
