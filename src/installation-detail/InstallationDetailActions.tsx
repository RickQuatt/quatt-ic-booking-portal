import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { FormSection } from "../ui-components/form/Form";
import { Button } from "../ui-components/button/Button";
import useRebootCic from "./hooks/useRebootCic";

interface InstallationDetailActionsProps {
  cicId: string;
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
  const rebootCic = useRebootCic(cicId);
  const isRebootDisabled = !versionSupportsReboot(quattBuild);
  const rebootLabel = isRebootDisabled
    ? "Reboot not supported by CIC version"
    : "Reboot CIC";

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="🔘 Actions" />
      <FormSection>
        <Button onClick={rebootCic} disabled={isRebootDisabled}>
          {rebootLabel}
        </Button>
      </FormSection>
    </div>
  );
}
