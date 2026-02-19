import { useState, useMemo, useCallback } from "react";
import { startOfDay } from "date-fns";
import type { TimeGranularity } from "../types/insights.types";
import { UNITS_FOR_TIME_GRANULARITY } from "../utils/insightsConstants";
import {
  minimumYAxisValueForTimeGranularity,
  roundLargeMeasurement,
  formatPower,
} from "../utils/insightsFormatting";
import {
  calculateTickValues,
  calculateHpPercentage,
  calculateFromDate,
  isSameDateUnit,
  getPreviousDate,
  getNextDate,
  startOf,
} from "../utils/insightsCalculations";
import { useGetInstallationInsights } from "./useGetInstallationInsights";
import { useInsightsUrlState } from "./useInsightsUrlState";

interface UseInsightsPresenterParams {
  installationUuid: string;
  insightsStartAt?: string | null;
}

export function useInsightsPresenter({
  installationUuid,
  insightsStartAt,
}: UseInsightsPresenterParams) {
  const [selectedTimeGranularity, setSelectedTimeGranularity] =
    useState<TimeGranularity>("day");
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date()),
  );
  const [isShowingSavingsDetails, setIsShowingSavingsDetails] = useState(false);
  const [isShowingCOPDetails, setIsShowingCOPDetails] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const minimumDate = useMemo(
    () =>
      insightsStartAt
        ? startOfDay(new Date(insightsStartAt))
        : startOfDay(new Date()),
    [insightsStartAt],
  );
  const maximumDate = useMemo(() => startOfDay(new Date()), []);
  const unit = UNITS_FOR_TIME_GRANULARITY[selectedTimeGranularity];

  // Sync state with URL parameters
  useInsightsUrlState({
    selectedDate,
    selectedTimeGranularity,
    minimumDate,
    maximumDate,
    onDateChange: setSelectedDate,
    onTimeGranularityChange: setSelectedTimeGranularity,
  });

  const fromDate = useMemo(
    () => calculateFromDate(selectedDate, unit, minimumDate),
    [selectedDate, unit, minimumDate],
  );

  const {
    insights,
    insightsError,
    isLoadingInsights,
    isFetchingInsights,
    refetchInsights,
  } = useGetInstallationInsights({
    installationUuid,
    from: fromDate,
    timeGranularity: selectedTimeGranularity,
  });

  // Calculate tick values for the chart
  const { tickValues, largestTotal, largestTotalHeatPower } = useMemo(
    () => calculateTickValues(insights, selectedTimeGranularity),
    [insights, selectedTimeGranularity],
  );

  const minimumYAxisValue = minimumYAxisValueForTimeGranularity(
    selectedTimeGranularity,
  );
  const largestBarValue = Math.max(
    minimumYAxisValue,
    largestTotalHeatPower,
    largestTotal,
  );

  // Navigation handlers
  const onTimeGranularityTabPress = useCallback(
    (granularity: TimeGranularity) => {
      setSelectedTimeGranularity(granularity);
      if (granularity === "all") {
        setSelectedDate(minimumDate);
      }
    },
    [minimumDate],
  );

  const onNextDatePress = useCallback(() => {
    if (unit) {
      setSelectedDate((prev) => getNextDate(prev, unit));
    }
  }, [unit]);

  const onPreviousDatePress = useCallback(() => {
    if (unit) {
      setSelectedDate((prev) => getPreviousDate(prev, unit, minimumDate));
    }
  }, [unit, minimumDate]);

  const onNowPress = useCallback(() => {
    if (unit) {
      setSelectedDate(startOf(new Date(), unit));
    }
  }, [unit]);

  const onCalendarPress = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const onConfirmDatePicker = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  }, []);

  const onCancelDatePicker = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  const toggleSavingsCard = useCallback(() => {
    setIsShowingSavingsDetails((prev) => !prev);
  }, []);

  const toggleCOPCard = useCallback(() => {
    setIsShowingCOPDetails((prev) => !prev);
  }, []);

  const onManualRefresh = useCallback(async () => {
    await refetchInsights();
  }, [refetchInsights]);

  // Navigation disable states
  const isNowDisabled = isSameDateUnit(selectedDate, new Date(), unit);
  const isPreviousDisabled = isSameDateUnit(selectedDate, minimumDate, unit);
  const isNextDisabled = isSameDateUnit(selectedDate, maximumDate, unit);
  const isCalendarDisabled =
    (isPreviousDisabled && isNextDisabled) || selectedTimeGranularity === "all";

  // Visibility rules
  const showSavingsAndCOP =
    selectedTimeGranularity !== "month" && selectedTimeGranularity !== "all";
  const showAdvancedInsights = selectedTimeGranularity !== "all";
  const hasInsights = Boolean(insightsStartAt);
  const isHeatDistributionBarHidden = !insights?.graph?.length;

  // HP percentage
  const hpPercentage = calculateHpPercentage(
    insights?.totalHpHeat,
    insights?.totalBoilerHeat,
  );

  // Formatted values
  const highestPowerConsumption = formatPower(largestBarValue);

  return {
    // State
    selectedTimeGranularity,
    selectedDate,
    fromDate,
    minimumDate,
    maximumDate,
    isShowingSavingsDetails,
    isShowingCOPDetails,
    showDatePicker,

    // Data
    insights,
    insightsError,
    isLoadingInsights,
    isFetchingInsights,
    tickValues,
    largestBarValue,
    largestTotal,
    minimumYAxisValue,
    highestPowerConsumption,
    hpPercentage,

    // Computed visibility
    hasInsights,
    showSavingsAndCOP,
    showAdvancedInsights,
    isHeatDistributionBarHidden,

    // Navigation states
    isNowDisabled,
    isPreviousDisabled,
    isNextDisabled,
    isCalendarDisabled,

    // Savings/COP computed values
    totalCostSavings: insights?.savingsMoney,
    gasSavings: insights?.savingsGas
      ? roundLargeMeasurement(insights.savingsGas)
      : 0,
    co2Savings: insights?.savingsCo2
      ? roundLargeMeasurement(insights.savingsCo2)
      : 0,
    gasCostSavings: insights?.savingsGasMoney,
    electricityCostSavings: insights?.savingsQuattElectricityCost,
    co2GasSaved: insights?.co2GasSaved
      ? roundLargeMeasurement(insights.co2GasSaved)
      : null,
    co2ElectricitySavings: insights?.co2Electricity
      ? roundLargeMeasurement(insights.co2Electricity)
      : 0,
    copValue: insights?.averageCOP,
    copTotalElectricPowerConsumption: insights?.totalHpElectric,
    totalHeatProduced: insights?.totalHpHeat,
    quattHeatProduced: insights?.totalHpHeat,
    quattElectricityConsumed: insights?.totalHpElectric,
    boilerHeatProduced: insights?.totalBoilerHeat,
    estimatedGasUsage: insights?.totalBoilerGas
      ? roundLargeMeasurement(insights.totalBoilerGas)
      : null,
    hasTariffs: insights?.hasTarrifs ?? false,

    // Actions
    onTimeGranularityTabPress,
    onNextDatePress,
    onPreviousDatePress,
    onNowPress,
    onCalendarPress,
    onConfirmDatePicker,
    onCancelDatePicker,
    toggleSavingsCard,
    toggleCOPCard,
    onManualRefresh,
  };
}
