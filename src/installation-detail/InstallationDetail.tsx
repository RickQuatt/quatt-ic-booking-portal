import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import classes from "./InstallationDetail.module.css";
import { InstallationDetailExtraInformation } from "./InstallationDetailExtraInformation";
import { InstallationDetailCicHistory } from "./InstallationDetailCicHistory";
import { InstallationDetailCommissioningHistory } from "./InstallationDetailCommissioningHistory";
import { InstallationDetailSettings } from "./InstallationDetailSettings";
import { InstallationDetailSettingsHistory } from "./InstallationDetailSettingsHistory";
import { InstallationDetailTickets } from "./InstallationDetailTickets";
import { InstallationHealthChecks } from "./InstallationHealthChecks";
import { InstallationDetailNotes } from "./installationDetailNotes";
import { InstallationDetailCICQR } from "./InstallationDetailCICQR";
import { Loader } from "../ui-components/loader/Loader";
import { useGetInstallationDetails } from "./hooks/useGetInstallationDetails";
import ErrorText from "../ui-components/error-text/ErrorText";
import { ResponseError } from "../api-client/runtime";
import { InstallationDetailTariff } from "./InstallationDetailTariff";
import { InstallationDetailActions } from "./InstallationDetailActions";
import { InstallationType } from "../api-client/models/InstallationType";
import { InstallationDetailAdvanced } from "./InstallationDetailAdvanced";
import { useGetZuperJobs } from "./hooks/useGetZuperJobs";
import { InstallationDetailZuperService } from "./InstallationDetailZuperService";

interface InstallationDetailProps {
  installationUuid: string;
}

export function InstallationDetail({
  installationUuid,
}: InstallationDetailProps) {
  const {
    installationDetails,
    installationDetailsError,
    isLoadingInstallationDetails,
    refetchInstallationDetails,
  } = useGetInstallationDetails(installationUuid);

  // TODO: implement Zuper changes
  const { zuperJobs, isLoadingZuperJobs, zuperJobsError, refetchZuperJobs } =
    useGetZuperJobs(installationUuid, installationDetails?.orderNumber);

  if (isLoadingInstallationDetails) {
    return <Loader />;
  }

  if (!installationDetails || installationDetailsError) {
    const installationNotfound =
      installationDetailsError instanceof ResponseError &&
      installationDetailsError?.response?.status === 404;

    const errorDescription = installationNotfound
      ? `No installation found with installationUuid ${installationUuid}`
      : `Failed to fetch installation details for installationUuid ${installationUuid}.`;

    const refetchInstallation = installationNotfound
      ? undefined
      : refetchInstallationDetails;

    return <ErrorText text={errorDescription} retry={refetchInstallation} />;
  }

  const installationId = installationDetails.externalId || "";

  if (!installationDetails.activeCic) {
    throw new Error("Active CIC not found");
  }
  const isAllE =
    installationDetails.installationType === InstallationType.AllElectric ||
    installationDetails.installationType === InstallationType.AllElectricDuo;
  return (
    <div className={classes["detail-sections"]}>
      <div className={classes["detail-sections-health"]}>
        <span className={classes["order-number"]}>
          {installationUuid} - {installationDetails.country}
        </span>
        <div className={classes["detail-section"]}>
          <DetailSectionHeader title="🏥 Health checks" />
          <InstallationHealthChecks
            installationUuid={installationUuid}
            isAllE={isAllE}
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
        {/* TODO: implement Zuper changes */}
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
        {/* TODO: implement Zuper changes */}
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
