import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import classes from "./InstallationDetail.module.css";
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
import ErrorText from "../ui-components/error-text/ErrorText";
import { ResponseError } from "../api-client/runtime";
import { InstallationDetailTariff } from "./InstallationDetailTariff";
import { InstallationDetailActions } from "./InstallationDetailActions";

interface InstallationDetailProps {
  orderNumber: string;
}

export function InstallationDetail({ orderNumber }: InstallationDetailProps) {
  const {
    installationDetails,
    installationDetailsError,
    isLoadingInstallationDetails,
    refetchInstallationDetails,
  } = useGetInstallationDetails(orderNumber);

  const { zuperJobs, isLoadingZuperJobs, zuperJobsError, refetchZuperJobs } =
    useGetZuperJobs(orderNumber);

  if (isLoadingInstallationDetails) {
    return <Loader />;
  }

  if (!installationDetails || installationDetailsError) {
    const installationNotfound =
      installationDetailsError instanceof ResponseError &&
      installationDetailsError?.response?.status === 404;

    const errorDescription = installationNotfound
      ? `No installation found with order number ${orderNumber}`
      : `Failed to fetch installation details for order number ${orderNumber}.`;

    const refetchInstallation = installationNotfound
      ? undefined
      : refetchInstallationDetails;

    return <ErrorText text={errorDescription} retry={refetchInstallation} />;
  }

  const installationId = installationDetails.externalId || "";

  return (
    <div className={classes["detail-sections"]}>
      <div className={classes["detail-sections-health"]}>
        <span className={classes["order-number"]}>{orderNumber}</span>
        <div className={classes["detail-section"]}>
          <DetailSectionHeader title="🏥 Health checks" />
          <InstallationHealthChecks
            orderNumber={orderNumber}
            cicId={installationDetails.activeCic}
            thermostatType={installationDetails.thermostatType}
            deviceConnectionStatuses={
              installationDetails.deviceConnectionStatuses
            }
            internetConnectionStatuses={
              installationDetails.internetConnectionStatuses
            }
            boilerType={installationDetails.boilerType}
            numberOfHeatPumps={installationDetails.numberOfHeatPumps}
          />
        </div>

        <InstallationDetailNotes installationId={installationId} />
        <InstallationDetailExtraInformation
          installation={installationDetails}
        />
        <InstallationDetailCicHistory installation={installationDetails} />
        <InstallationDetailCommissioningHistory
          installation={installationDetails}
        />
      </div>
      <div className={classes["detail-sections-insights"]}>
        <InstallationDetailAdvanced
          installation={installationDetails}
          zuperInstallationJobs={zuperJobs?.installations}
          isLoadingZuperJobs={isLoadingZuperJobs}
        />
        <InstallationDetailActions
          cicId={installationDetails.activeCic}
          quattBuild={installationDetails.quattBuild}
        />
        <InstallationDetailSettingsHistory installation={installationDetails} />
        <InstallationDetailSettings installation={installationDetails} />
      </div>

      <div className={classes["detail-sections-api"]}>
        <InstallationDetailTickets installationId={installationId} />
        <InstallationDetailZuperService
          zuperServiceJobs={zuperJobs?.services}
          isLoadingJobs={isLoadingZuperJobs}
          zuperJobsError={zuperJobsError}
          refetch={refetchZuperJobs}
        />
        <InstallationDetailTariff installationId={installationId} />
        <InstallationDetailCICQR cicId={installationDetails.activeCic} />
      </div>
    </div>
  );
}
