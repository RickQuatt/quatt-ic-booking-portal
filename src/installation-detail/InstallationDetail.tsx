import { Link } from "wouter";
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
import { InstallationDetailCICQR } from "./InstallationDetailCICQR";
import { Loader } from "../ui-components/loader/Loader";
import { useGetInstallationDetails } from "./hooks/useGetInstallationDetails";
import { useGetZuperJobs } from "./hooks/useGetZuperJobs";

interface InstallationDetailProps {
  orderNumber: string;
}

export function InstallationDetail({ orderNumber }: InstallationDetailProps) {
  const { installationDetails, isLoadingInstallationDetails } =
    useGetInstallationDetails(orderNumber);

  const { zuperJobs, isLoadingZuperJobs, zuperJobsError } =
    useGetZuperJobs(orderNumber);

  if (isLoadingInstallationDetails) {
    return <Loader />;
  }

  if (!installationDetails) {
    return <span>Failed to fetch installation data 🚨</span>;
  }

  const installationId = installationDetails.externalId || "";

  return (
    <div className={classes["detail-sections"]}>
      <div className={classes["detail-sections-health"]}>
        <div className={classes["detail-section-header"]}>{orderNumber}</div>

        <div className={classes["detail-section"]}>
          <DetailSectionHeader title="🏥 Health checks" />
          <InstallationHealthChecks
            orderNumber={orderNumber}
            cicId={installationDetails.activeCic}
          />
        </div>

        <InstallationDetailNotes installationId={installationId} />
        <InstallationDetailExtraInformation
          installation={installationDetails}
        />
        <InstallationDetailCicHistory installation={installationDetails} />
        <InstallationDetailCommissioningHistory
          installationId={installationId}
          installation={installationDetails}
        />
      </div>

      <div className={classes["detail-sections-insights"]}>
        <InstallationDetailAdvanced
          installation={installationDetails}
          zuperInstallationJobs={zuperJobs?.installations}
          isLoadingZuperJobs={isLoadingZuperJobs}
        />
        <InstallationDetailSettingsHistory
          installationId={installationId}
          installation={installationDetails}
        />
        <InstallationDetailSettings installation={installationDetails} />
      </div>

      <div className={classes["detail-sections-api"]}>
        <InstallationDetailTickets installationId={installationId} />
        <InstallationDetailZuperService
          zuperServiceJobs={zuperJobs?.services}
          isLoadingJobs={isLoadingZuperJobs}
          zuperJobsError={zuperJobsError}
        />
        {/* TODO Uncomment when feature is live on production
        https://linear.app/quatt/issue/SUP-122/enable-historic-tariffs-when-the-feature-is-live-on-production
        */}
        {/* <InstallationDetailTariff
          tariff={tariff}
          installationId={installationId}
        /> */}
        <InstallationDetailCICQR installation={installationDetails} />
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
