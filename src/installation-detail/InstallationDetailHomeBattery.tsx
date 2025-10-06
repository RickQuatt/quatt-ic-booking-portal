import { AdminInstallationDetail } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { useHomeBatteryDevice } from "./hooks/useHomeBatteryDevice";

// Helper function to format connectivity status
const formatConnectivityStatus = (status: string) => {
  return status === "connected" ? "🟢 Connected" : "🔴 Disconnected";
};

// Helper function to format power in kW
const formatPowerInKW = (power: number | null | undefined) => {
  if (power === null || power === undefined) return "N/A";
  const direction = power >= 0 ? "Charging" : "Discharging";
  return `${power > 0 ? "+" : ""}${power.toFixed(2)} kW (${direction})`;
};

// Helper function to format control action to readable text
const formatControlAction = (action: string | undefined) => {
  const actionMap: Record<string, string> = {
    balancingTheGrid: "Grid Balancing",
    chargingCheapEnergy: "Charging Cheap Energy",
    storingSolarEnergy: "Storing Solar Energy",
    sellingHighPrices: "Selling at High Prices",
    usingBatteryEnergy: "Using Battery Energy",
    waitingToCharge: "Waiting to Charge",
    waitingToDischarge: "Waiting to Discharge",
    reducingPowerPeaks: "Reducing Power Peaks",
    undeterminedAction: "Undetermined",
  };
  return action ? actionMap[action] || action : "N/A";
};

// Helper function to format currency (euros)
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "N/A";
  return `€${amount.toFixed(2)}`;
};

export function InstallationDetailHomeBattery({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  const { homeBatteryDevice, batterySn } = useHomeBatteryDevice(installation);

  if (!homeBatteryDevice || !batterySn) {
    return (
      <div className={classes["detail-section"]}>
        <DetailSectionHeader title="🔋 Home Battery Information" />
        <FormSection>
          <FormField>
            <FormFieldValue value="Home battery information not available. Battery may not be commissioned yet." />
          </FormField>
        </FormSection>
      </div>
    );
  }

  const {
    currentBatteryInsights,
    currentBuildingInsights,
    batterySpecifications,
  } = homeBatteryDevice;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="🔋 Home Battery Information" />
      <FormSection>
        {/* Current Status Section */}
        <FormField>
          <FormFieldTitle>Connectivity Status</FormFieldTitle>
          <FormFieldValue
            value={formatConnectivityStatus(
              homeBatteryDevice.connectivityStatus,
            )}
          />
        </FormField>

        {currentBatteryInsights && (
          <>
            <FormField>
              <FormFieldTitle>Battery Charge</FormFieldTitle>
              <FormFieldValue
                value={
                  currentBatteryInsights.chargeState !== null &&
                  currentBatteryInsights.chargeState !== undefined
                    ? `${currentBatteryInsights.chargeState}%`
                    : "N/A"
                }
              />
            </FormField>

            <FormField>
              <FormFieldTitle>Current Power</FormFieldTitle>
              <FormFieldValue
                value={formatPowerInKW(currentBatteryInsights.powerInKW)}
              />
            </FormField>

            <FormField>
              <FormFieldTitle>Current Action</FormFieldTitle>
              <FormFieldValue
                value={formatControlAction(
                  currentBatteryInsights.controlAction,
                )}
              />
            </FormField>
          </>
        )}

        {/* Financial Overview Section */}
        {currentBuildingInsights && (
          <>
            <FormField>
              <FormFieldTitle>Total Savings (Cumulative)</FormFieldTitle>
              <FormFieldValue
                value={formatCurrency(
                  currentBuildingInsights.totalSavingsCumulative,
                )}
              />
            </FormField>

            <FormField>
              <FormFieldTitle>Yesterday's Savings</FormFieldTitle>
              <FormFieldValue
                value={formatCurrency(
                  currentBuildingInsights.totalSavingsYesterday,
                )}
              />
            </FormField>

            <FormField>
              <FormFieldTitle>Smart Energy Savings</FormFieldTitle>
              <FormFieldValue
                value={`${formatCurrency(currentBuildingInsights.savingsSmartEnergyCumulative)} (yesterday: ${formatCurrency(currentBuildingInsights.savingsSmartEnergyYesterday)})`}
              />
            </FormField>

            <FormField>
              <FormFieldTitle>Grid Balancing Income</FormFieldTitle>
              <FormFieldValue
                value={`${formatCurrency(currentBuildingInsights.savingsGridBalancingCumulative)} (yesterday: ${formatCurrency(currentBuildingInsights.savingsGridBalancingYesterday)})`}
              />
            </FormField>
          </>
        )}

        {/* Technical Specifications */}
        <FormField>
          <FormFieldTitle>Battery Serial Number</FormFieldTitle>
          <FormFieldValue value={batterySn} />
        </FormField>

        {batterySpecifications?.powerInKwRange && (
          <FormField>
            <FormFieldTitle>Power Capacity Range</FormFieldTitle>
            <FormFieldValue
              value={`${batterySpecifications.powerInKwRange?.minKW} kW - ${batterySpecifications.powerInKwRange?.maxKW} kW`}
            />
          </FormField>
        )}
      </FormSection>
    </div>
  );
}
