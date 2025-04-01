import { useEffect, useState } from "react";
import {
  AdminCic,
  AllEStatusHeatBatterySizeEnum,
  AllEStatusHeatBatteryStatusEnum,
} from "../api-client/models";
import EmergencyButton from "../ui-components/emergency-button/EmergencyButton";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { DetailSectionHeader } from "./CICDetailSectionHeader";
import { useApiClient } from "../api-client/context";
import React from "react";
import { AdminUpdateCicRequest } from "../api-client/apis";

const statusMap: {
  [key in AllEStatusHeatBatteryStatusEnum]: string;
} = {
  [AllEStatusHeatBatteryStatusEnum.Charging]: "Charging",
  [AllEStatusHeatBatteryStatusEnum.Discharging]: "Discharging",
  [AllEStatusHeatBatteryStatusEnum.Off]: "Off",
};

const batterySizeMap: {
  [key in AllEStatusHeatBatterySizeEnum]: string;
} = {
  [AllEStatusHeatBatterySizeEnum.ExtraLarge]: "Extra Large",
  [AllEStatusHeatBatterySizeEnum.Large]: "Large",
  [AllEStatusHeatBatterySizeEnum.Medium]: "Medium",
};

export type AdminCicWithRequiredAllEStatus = Omit<AdminCic, "allEStatus"> & {
  allEStatus: NonNullable<AdminCic["allEStatus"]>;
};

export function CICDetailAllE({
  cicData,
}: {
  cicData: AdminCicWithRequiredAllEStatus;
}) {
  const { allEStatus } = cicData;
  const {
    heatBatteryStatus,
    isDomesticHotWaterOn,
    heatBatterySize,
    showerMinutes,
    heatBatteryPercentage,
    heatBatterySensorFailureFlags,
    heatChargerDegradationReasonFlags,
    emergencyBackupHeaterEnabled,
    heatChargerCompressorEnabled,
  } = allEStatus;

  const [emergencyState, setEmergencyState] = useState(
    emergencyBackupHeaterEnabled || false,
  );
  const [isDisabled, setIsDisabled] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingMessage, setPollingMessage] = useState(
    "Waiting for confirmation...",
  );

  const apiClient = useApiClient();

  const onEnable = async () => {
    setIsDisabled(true); // Disable the button during API call
    setIsPolling(true); // Start polling visual indication
    setPollingMessage("Waiting for emergency backup heating to enable...");

    const response = await apiClient.adminUpdateCic({
      cicId: cicData.id,
      updateAdminCic: {
        setAllEEmergencyBackupHeaterState: "on",
      },
    });

    if (response.meta.status === 200) {
      // Start polling to check emergencyBackupHeaterEnabled status
      const startTime = Date.now();
      const timeoutDuration = 30000; // 30 seconds in milliseconds
      const pollInterval = 2000; // Poll every 2 seconds

      const checkEmergencyStatus = async () => {
        try {
          if (Date.now() - startTime > timeoutDuration) {
            alert(
              "Polling to verify enabling of emergency backup heating timed out after 30 seconds",
            );
            setIsDisabled(false);
            setIsPolling(false);
            return;
          }

          const statusResponse = await apiClient.adminGetCic({
            cicId: cicData.id,
          });

          if (statusResponse.result.allEStatus?.emergencyBackupHeaterEnabled) {
            setEmergencyState(true);
            setIsDisabled(false);
            setIsPolling(false);
          } else {
            // Continue polling if not yet enabled
            setTimeout(checkEmergencyStatus, pollInterval);
          }
        } catch (e) {
          console.error("Error checking emergency status", e);
          alert("Error checking emergency status");
          setIsDisabled(false);
          setIsPolling(false);
        }
      };

      checkEmergencyStatus();
      return { success: true };
    }

    setIsDisabled(false);
    setIsPolling(false);
    return { success: false };
  };

  const onDisable = async () => {
    setIsDisabled(true); // Disable the button during API call
    setIsPolling(true); // Start polling visual indication
    setPollingMessage("Waiting for emergency backup heating to disable...");

    const response = await apiClient.adminUpdateCic({
      cicId: cicData.id,
      updateAdminCic: {
        setAllEEmergencyBackupHeaterState: "off",
      },
    });

    if (response.meta.status === 200) {
      // Start polling to check emergencyBackupHeaterEnabled status
      const startTime = Date.now();
      const timeoutDuration = 30000; // 30 seconds in milliseconds
      const pollInterval = 2000; // Poll every 2 seconds

      const checkEmergencyStatus = async () => {
        if (Date.now() - startTime > timeoutDuration) {
          alert(
            "Polling to verify disabling of emergency backup heating timed out after 30 seconds",
          );
          setIsDisabled(false);
          setIsPolling(false);
          return;
        }

        const statusResponse = await apiClient.adminGetCic({
          cicId: cicData.id,
        });

        if (
          statusResponse.result.allEStatus?.emergencyBackupHeaterEnabled ===
          false
        ) {
          setEmergencyState(false);
          setIsDisabled(false);
          setIsPolling(false);
        } else {
          // Continue polling if not yet disabled
          setTimeout(checkEmergencyStatus, pollInterval);
        }
      };

      checkEmergencyStatus();
      return { success: true };
    }

    setIsDisabled(false);
    setIsPolling(false);
    return { success: false };
  };

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="⚡ 🔋 All-E Charger & Battery" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Heat Battery Status</FormFieldTitle>
          <FormFieldValue value={statusMap[heatBatteryStatus]} />
        </FormField>
        <FormField>
          <FormFieldTitle>Heat Battery Size</FormFieldTitle>
          <FormFieldValue value={batterySizeMap[heatBatterySize]} />
        </FormField>
        <FormField>
          <FormFieldTitle>Heat Battery Charge Percentage</FormFieldTitle>
          <FormFieldValue value={heatBatteryPercentage} />
        </FormField>
        <FormField>
          <FormFieldTitle>Shower Minutes Available</FormFieldTitle>
          <div className={classes["chip"]}>
            {typeof showerMinutes === "number"
              ? `${showerMinutes} minutes`
              : "N/A"}
          </div>
        </FormField>
        <FormField>
          <FormFieldTitle>Is Hot Water Turned On?</FormFieldTitle>
          <div className={classes["chip"]}>
            {isDomesticHotWaterOn
              ? "Yes"
              : typeof isDomesticHotWaterOn === "boolean"
                ? "No"
                : "N/A"}
          </div>
        </FormField>
        <FormField>
          <FormFieldTitle>Heat Battery Sensor Failure Issues</FormFieldTitle>
          <div className={classes["chip-wrapper"]}>
            {heatBatterySensorFailureFlags?.length === 0 ? (
              <div className={`${classes["chip"]} ${classes["chip-info"]}`}>
                👍 None
              </div>
            ) : (
              heatBatterySensorFailureFlags?.map((flag, index) => (
                <div
                  key={index}
                  className={`${classes["chip"]} ${classes["chip-warn"]}`}
                >
                  {flag}
                </div>
              ))
            )}
          </div>
        </FormField>
        <FormField>
          <FormFieldTitle>Heat Charger Compressor Enabled</FormFieldTitle>
          <FormFieldValue value={heatChargerCompressorEnabled} />
        </FormField>
        <FormField>
          <FormFieldTitle>Heat Charger Degration Reason Flags</FormFieldTitle>
          <div
            className={classes["chip-wrapper"]}
            style={{ marginBottom: "10px" }}
          >
            {heatChargerDegradationReasonFlags?.length === 0 ? (
              <div className={`${classes["chip"]} ${classes["chip-info"]}`}>
                👍 None
              </div>
            ) : (
              heatChargerDegradationReasonFlags?.map((flag, index) => (
                <div
                  key={index}
                  className={`${classes["chip"]} ${classes["chip-warn"]}`}
                >
                  {flag}
                </div>
              ))
            )}
          </div>
        </FormField>
      </FormSection>

      <div style={{ marginBottom: "10px" }} />
      <DetailSectionHeader title="Advanced Controls" />
      <div style={{ marginBottom: "10px" }} />
      <EmergencyButton
        label={
          emergencyState
            ? "Emergency Backup Heating Enabled"
            : "Emergency Backup Heating Disabled"
        }
        onEnable={async () => await onEnable()}
        onDisable={async () => await onDisable()}
        enabled={emergencyState}
        disabled={isDisabled}
        isPolling={isPolling}
        pollingMessage={pollingMessage}
      />
    </div>
  );
}
