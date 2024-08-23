import classes from "./HealthCheckIndicator.module.css";
import { CicHealthCheckStatus } from "../api-client/models";
import { HealthCheckCircle } from "../cic-health-list/HealthCheckCircle";
import Tooltip from "../ui-components/tooltip/Tooltip";

interface HealthCheckCircleWithTitleProps {
  title: string;
  status: CicHealthCheckStatus;
  errorStatusText?: string;
  notApplicableStatusText?: string;
}

function HealthCheckIndicator({
  title,
  status,
  errorStatusText,
  notApplicableStatusText = `
    Can't get the status.
    Either the CIC's internet connection is bad or disconnected, or we're missing the related value.`,
}: HealthCheckCircleWithTitleProps) {
  let tooltipText = "";
  const isStatusNotApplicable = status === CicHealthCheckStatus.NotApplicable;
  const isStatusError = status === CicHealthCheckStatus.Error;
  const showTooltip = isStatusNotApplicable || isStatusError;

  if (isStatusNotApplicable) {
    tooltipText = notApplicableStatusText;
  }

  if (isStatusError && errorStatusText) {
    tooltipText = errorStatusText;
  }

  return (
    <Tooltip text={tooltipText} showTooltip={showTooltip}>
      <span>{title}</span>
      <HealthCheckCircle
        status={status}
        propClasses={classes["horizontal-center"]}
      />
    </Tooltip>
  );
}

export default HealthCheckIndicator;
