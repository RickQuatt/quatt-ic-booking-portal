import { Link } from "wouter";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { Loader } from "../ui-components/loader/Loader";
import ErrorText from "../ui-components/error-text/ErrorText";
import { SnowflakeInfo } from "../api-client/models";
import { useGetSnowflakeInfo } from "./hooks/useGetSnowflakeInfo";
import {
  formatKeyLabel,
  formatValue,
  getConnectionColor,
  isCicIdField,
  isObjectValue,
  type SnowflakeValue,
} from "../utils/snowflakeFormatters";
import classes from "./InstallationSnowflakeTables.module.css";

interface InstallationSnowflakeTablesProps {
  installationUuid: string;
}

export function InstallationSnowflakeTables({
  installationUuid,
}: InstallationSnowflakeTablesProps) {
  const {
    snowflakeInfo,
    isLoadingSnowflakeInfo,
    snowflakeInfoError,
    refetchSnowflakeInfo,
  } = useGetSnowflakeInfo(installationUuid);

  if (isLoadingSnowflakeInfo) {
    return <Loader />;
  }

  if (snowflakeInfoError || !snowflakeInfo) {
    return (
      <ErrorText
        text="Failed to fetch Snowflake data for the installation."
        retry={refetchSnowflakeInfo}
      />
    );
  }

  const { health, info, connections } = snowflakeInfo;

  /**
   * Render a table row for basic items
   */
  const renderTableRow = (item: SnowflakeInfo) => {
    const label = formatKeyLabel(item.key);
    const value = item.value as SnowflakeValue;
    const displayValue = formatValue(value);

    // Special handling for CIC ID - make it clickable
    if (isCicIdField(item.key, value)) {
      return (
        <tr key={item.key}>
          <td className={classes["label"]}>{label}</td>
          <td className={classes["value"]}>
            <Link href={`/cics/${value}`} className={classes["value-link"]}>
              {value}
            </Link>
          </td>
        </tr>
      );
    }

    // Handle nested objects with code block formatting
    if (isObjectValue(value)) {
      return (
        <tr key={item.key}>
          <td className={classes["label"]}>{label}</td>
          <td className={classes["value"]}>
            <pre className={classes["value-object"]}>{displayValue}</pre>
          </td>
        </tr>
      );
    }

    // Default row rendering
    return (
      <tr key={item.key}>
        <td className={classes["label"]}>{label}</td>
        <td className={classes["value"]}>{displayValue}</td>
      </tr>
    );
  };

  /**
   * Render a connection status row with colored indicator
   */
  const renderConnectionRow = (item: SnowflakeInfo) => {
    const label = formatKeyLabel(item.key);
    const value = item.value as SnowflakeValue;
    const displayValue = formatValue(value);
    const color = getConnectionColor(value);

    return (
      <tr key={item.key}>
        <td className={classes["label"]}>{label}</td>
        <td className={classes["value"]}>
          {color ? (
            <div className={classes["connection-status"]}>
              <span
                className={`${classes["status-dot"]} ${
                  color === "green"
                    ? classes["status-green"]
                    : classes["status-red"]
                }`}
              />
              {displayValue}
            </div>
          ) : (
            displayValue
          )}
        </td>
      </tr>
    );
  };

  return (
    <>
      {/* Snowflake Health Checks Section */}
      <div className={classes["panel"]}>
        <DetailSectionHeader title="🏥 Snowflake Health checks" />
        <table className={classes["table"]}>
          <tbody>
            {health
              .filter((item) => item.key !== "RELATED_IDS")
              .map(renderTableRow)}
          </tbody>
        </table>
      </div>

      {/* Snowflake Info Section */}
      <div className={classes["panel"]}>
        <DetailSectionHeader title="🔍 Snowflake Info" />
        <table className={classes["table"]}>
          <tbody>
            {info
              .filter((item) => item.key !== "RELATED_IDS")
              .map(renderTableRow)}
          </tbody>
        </table>
      </div>

      {/* Snowflake Connections Section */}
      <div className={classes["panel"]}>
        <DetailSectionHeader title="🔗 Snowflake Connections" />
        <table className={classes["table"]}>
          <tbody>
            {connections
              .filter((item) => item.key !== "RELATED_IDS")
              .map(renderConnectionRow)}
          </tbody>
        </table>
      </div>
    </>
  );
}
