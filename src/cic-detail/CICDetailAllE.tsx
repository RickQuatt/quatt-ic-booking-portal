import {
  AdminCic,
  AllEStatusHeatBatterySizeEnum,
  AllEStatusHeatBatteryStatusEnum,
} from "../api-client/models";
// import EmergencyButton from "../ui-components/emergency-button/EmergencyButton";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { DetailSectionHeader } from "./CICDetailSectionHeader";

const statusMap: {
  [key in AllEStatusHeatBatteryStatusEnum]: string;
} = {
  [AllEStatusHeatBatteryStatusEnum.Charging]: "Charging",
  [AllEStatusHeatBatteryStatusEnum.Discharging]: "Discharging",
  [AllEStatusHeatBatteryStatusEnum.False]: "Idle",
};

const batterySizeMap: {
  [key in AllEStatusHeatBatterySizeEnum]: string;
} = {
  [AllEStatusHeatBatterySizeEnum.ExtraLarge]: "Extra Large",
  [AllEStatusHeatBatterySizeEnum.Large]: "Large",
  [AllEStatusHeatBatterySizeEnum.Medium]: "Medium",
};

export function CICDetailAllE({ cicData }: { cicData: AdminCic }) {
  const { allEStatus } = cicData;
  if (!allEStatus) {
    return null;
  }

  const {
    heatBatteryStatus,
    isDomesticHotWaterOn,
    heatBatterySize,
    showerMinutes,
    heatBatteryPercentage,
    heatBatterySensorFailureFlags,
    heatChargerDegradationReasonFlags,
  } = allEStatus;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="⚡ 🔋 All-E Charger & Battery" />
      <FormSection>
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
                None
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
      </FormSection>

      {/* <div style={{ marginBottom: "10px" }} />
      <DetailSectionHeader title="Advanced Controls" />
      <EmergencyButton /> */}
    </div>
  );
}
