import classNames from "classnames";
import { CicHealthCheckStatus } from "../api-client/models";
import classes from "./HealthCheckCircle.module.css";

export function HealthCheckCircle({
  status,
  propClasses,
}: {
  status: CicHealthCheckStatus;
  propClasses?: string;
}) {
  return (
    <div
      className={classNames(
        classes["health-check-circle"],
        classes[status],
        propClasses,
      )}
    ></div>
  );
}
