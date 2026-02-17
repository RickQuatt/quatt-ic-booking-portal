import { Loader } from "@/components/shared/Loader";
import { ErrorText } from "@/components/shared/ErrorText";
import { useGetInstallationDetails } from "../hooks/useGetInstallationDetails";
import { InsightsPage } from "./page";

interface InsightsPageWrapperProps {
  installationUuid: string;
}

export function InsightsPageWrapper({
  installationUuid,
}: InsightsPageWrapperProps) {
  const {
    installationDetails,
    installationDetailsError,
    isLoadingInstallationDetails,
    refetchInstallationDetails,
  } = useGetInstallationDetails(installationUuid);

  if (isLoadingInstallationDetails) {
    return <Loader />;
  }

  if (!installationDetails || installationDetailsError) {
    return (
      <ErrorText
        text={`Failed to fetch installation details for ${installationUuid}.`}
        retry={() => refetchInstallationDetails()}
      />
    );
  }

  return (
    <InsightsPage
      installationUuid={installationUuid}
      installationName={installationDetails.name ?? undefined}
      cicId={installationDetails.activeCic ?? undefined}
      insightsStartAt={installationDetails.insightsStartAt}
    />
  );
}
