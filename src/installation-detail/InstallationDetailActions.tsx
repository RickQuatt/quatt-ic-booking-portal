import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { FormSection } from "../ui-components/form/Form";
import { Button, ButtonLink } from "../ui-components/button/Button";
import useRebootCic from "./hooks/useRebootDevice";
import { AdminRebootDeviceRequestTargetEnum } from "../api-client/models/AdminRebootDeviceRequest";

interface InstallationDetailActionsProps {
  cicId: string | null;
  quattBuild: string | null;
}

// It would be better to fetch this from the backend,
// but the value shouldn't change and on the backend it's also
// hardcoded in a config file
const versionSupportsReboot = (version: string | null) => {
  if (!version) {
    return false;
  }

  const [major, minor] = version.split(".").map(Number);
  return major > 2 || (major === 2 && minor >= 16);
};

export function InstallationDetailActions({
  cicId,
  quattBuild,
}: InstallationDetailActionsProps) {
  const rebootCic = useRebootCic(
    cicId || "",
    AdminRebootDeviceRequestTargetEnum.Cic,
  );
  const isRebootDisabled = !cicId || !versionSupportsReboot(quattBuild);
  const rebootLabel = isRebootDisabled
    ? "Reboot not supported by CIC version"
    : "Reboot CIC";

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="🔘 Actions" />
      <FormSection>
        {cicId && (
          <Button onClick={rebootCic} disabled={isRebootDisabled}>
            {rebootLabel}
          </Button>
        )}
        <ButtonLink
          href="https://quatt-team.atlassian.net/jira/software/c/projects/NCR/form/36"
          target="_blank"
          rel="noopener noreferrer"
        >
          Submit a Field NCR
        </ButtonLink>
      </FormSection>
    </div>
  );
}
