import { CicHealthCheckStatus } from "../../api-client/models";
import classes from "./HealthCheckText.module.css";
import Tooltip from "../tooltip/Tooltip";

interface HealthCheckTextProps {
  title: string;
  status: CicHealthCheckStatus;
  errorStatusText: string;
  notApplicableStatusText?: string;
}

const connectionTextByStatus: Record<CicHealthCheckStatus, string> = {
  [CicHealthCheckStatus.Correct]: "Connected",
  [CicHealthCheckStatus.Error]: "Disconnected",
  [CicHealthCheckStatus.Warning]: "Warning",
  [CicHealthCheckStatus.NotApplicable]: "N/A",
};

const colorsByStatus: Record<CicHealthCheckStatus, string> = {
  [CicHealthCheckStatus.Correct]: "green",
  [CicHealthCheckStatus.Error]: "red",
  [CicHealthCheckStatus.Warning]: "yellow",
  [CicHealthCheckStatus.NotApplicable]: "gray",
};

function HealthCheckText({
  title,
  status,
  errorStatusText,
  notApplicableStatusText = `
    Can't get the status.
    Either the CIC's internet connection is bad or disconnected, or we're missing the related value.`,
}: HealthCheckTextProps) {
  const connectedText = connectionTextByStatus[status];
  const isStatusNotApplicable = status === CicHealthCheckStatus.NotApplicable;
  const isStatusError = status === CicHealthCheckStatus.Error;
  const showTooltip = isStatusNotApplicable || isStatusError;

  let tooltipText = "";
  if (isStatusNotApplicable) {
    tooltipText = notApplicableStatusText;
  }

  if (isStatusError && errorStatusText) {
    tooltipText = errorStatusText;
  }

  return (
    <div>
      <Tooltip text={tooltipText} showTooltip={showTooltip}>
        <div className={classes["health-check-container"]}>
          <h3 className={classes["health-check-title"]}>{title}:</h3>
          <span style={{ color: colorsByStatus[status] }}>{connectedText}</span>
        </div>
      </Tooltip>
    </div>
  );
}

export default HealthCheckText;
