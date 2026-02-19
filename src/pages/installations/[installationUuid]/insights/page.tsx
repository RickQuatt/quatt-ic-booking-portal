import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/shared/Loader";
import { ErrorText } from "@/components/shared/ErrorText";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useCallback, useEffect } from "react";
import { useInsightsPresenter } from "./hooks/useInsightsPresenter";
import {
  TimeGranularityTabs,
  DateNavigationBar,
  DatePickerModal,
  SavingsCard,
  COPCard,
  CentralHeatingSection,
  OutsideTemperatureChart,
  RoomTemperatureChart,
  WaterTemperatureChart,
} from "./components";

interface InsightsPageProps {
  installationUuid: string;
  installationName?: string;
  cicId?: string;
  insightsStartAt?: string | null;
}

export function InsightsPage({
  installationUuid,
  installationName,
  cicId,
  insightsStartAt,
}: InsightsPageProps) {
  const presenter = useInsightsPresenter({
    installationUuid,
    insightsStartAt,
  });

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          if (!presenter.isPreviousDisabled) presenter.onPreviousDatePress();
          break;
        case "ArrowRight":
          if (!presenter.isNextDisabled) presenter.onNextDatePress();
          break;
        case "t":
        case "T":
          if (!presenter.isNowDisabled) presenter.onNowPress();
          break;
        case "r":
        case "R":
          presenter.onManualRefresh();
          break;
        case "1":
          presenter.onTimeGranularityTabPress("day");
          break;
        case "2":
          presenter.onTimeGranularityTabPress("week");
          break;
        case "3":
          presenter.onTimeGranularityTabPress("month");
          break;
        case "4":
          presenter.onTimeGranularityTabPress("year");
          break;
        case "5":
          presenter.onTimeGranularityTabPress("all");
          break;
      }
    },
    [presenter],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!presenter.hasInsights) {
    return (
      <div className="p-6">
        <BackLink installationUuid={installationUuid} />
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Insights are not available for this installation yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Insights become available once the CIC has been connected and
            collecting data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white px-6 py-3 shadow-md dark:border-gray-700 dark:bg-dark-foreground dark:shadow-gray-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackLink installationUuid={installationUuid} />
            <div>
              <h1 className="text-lg font-semibold">
                {cicId || "Installation"} - Insights
              </h1>
              {installationName && (
                <p className="text-sm text-muted-foreground">
                  {installationName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-6">
        {/* Time granularity tabs */}
        <TimeGranularityTabs
          selected={presenter.selectedTimeGranularity}
          onTabPress={presenter.onTimeGranularityTabPress}
        />

        {/* Date navigation */}
        <DateNavigationBar
          date={presenter.selectedDate}
          timeGranularity={presenter.selectedTimeGranularity}
          minimumDate={presenter.minimumDate}
          maximumDate={presenter.maximumDate}
          isPreviousDisabled={presenter.isPreviousDisabled}
          isNextDisabled={presenter.isNextDisabled}
          isNowDisabled={presenter.isNowDisabled}
          isCalendarDisabled={presenter.isCalendarDisabled}
          isFetching={presenter.isFetchingInsights}
          onPreviousPress={presenter.onPreviousDatePress}
          onNextPress={presenter.onNextDatePress}
          onNowPress={presenter.onNowPress}
          onCalendarPress={presenter.onCalendarPress}
          onRefresh={presenter.onManualRefresh}
        />

        {/* Error state - shown inline, keeps navigation usable */}
        {presenter.insightsError && (
          <ErrorText
            text="Failed to load insights data."
            retry={() => presenter.onManualRefresh()}
          />
        )}

        {/* Loading state */}
        {!presenter.insightsError && presenter.isLoadingInsights && (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        )}

        {!presenter.insightsError && !presenter.isLoadingInsights && (
          <>
            {/* Savings & COP cards */}
            {presenter.showSavingsAndCOP && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SavingsCard
                  isExpanded={presenter.isShowingSavingsDetails}
                  onToggle={presenter.toggleSavingsCard}
                  totalCostSavings={presenter.totalCostSavings}
                  gasSavings={presenter.gasSavings}
                  co2Savings={presenter.co2Savings}
                  gasCostSavings={presenter.gasCostSavings}
                  electricityCostSavings={presenter.electricityCostSavings}
                  co2GasSaved={presenter.co2GasSaved}
                  co2ElectricitySavings={presenter.co2ElectricitySavings}
                  hasTariffs={presenter.hasTariffs}
                />
                <COPCard
                  isExpanded={presenter.isShowingCOPDetails}
                  onToggle={presenter.toggleCOPCard}
                  copValue={presenter.copValue}
                  totalHeatProduced={presenter.totalHeatProduced}
                  totalElectricPowerConsumption={
                    presenter.copTotalElectricPowerConsumption
                  }
                />
              </div>
            )}

            {/* Central Heating section */}
            <CentralHeatingSection
              tickValues={presenter.tickValues}
              largestBarValue={presenter.largestBarValue}
              hpPercentage={presenter.hpPercentage}
              quattHeatProduced={presenter.quattHeatProduced}
              quattElectricityConsumed={presenter.quattElectricityConsumed}
              boilerHeatProduced={presenter.boilerHeatProduced}
              isHidden={presenter.isHeatDistributionBarHidden}
            />

            {/* Advanced Insights - Temperature graphs */}
            {presenter.showAdvancedInsights &&
              presenter.insights &&
              (presenter.insights.outsideTemperatureGraph ||
                presenter.insights.roomTemperatureGraph ||
                presenter.insights.waterTemperatureGraph) && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Advanced Insights
                      </span>
                    </div>
                  </div>

                  {presenter.insights.outsideTemperatureGraph && (
                    <OutsideTemperatureChart
                      data={presenter.insights.outsideTemperatureGraph}
                      timeGranularity={presenter.selectedTimeGranularity}
                    />
                  )}

                  {presenter.selectedTimeGranularity === "day" &&
                    presenter.insights.roomTemperatureGraph && (
                      <RoomTemperatureChart
                        data={presenter.insights.roomTemperatureGraph}
                      />
                    )}

                  {presenter.selectedTimeGranularity === "day" &&
                    presenter.insights.waterTemperatureGraph && (
                      <WaterTemperatureChart
                        data={presenter.insights.waterTemperatureGraph}
                      />
                    )}
                </div>
              )}
          </>
        )}
      </div>

      {/* Date picker modal */}
      <DatePickerModal
        open={presenter.showDatePicker}
        selectedDate={presenter.selectedDate}
        minimumDate={presenter.minimumDate}
        maximumDate={presenter.maximumDate}
        onConfirm={presenter.onConfirmDatePicker}
        onCancel={presenter.onCancelDatePicker}
      />
    </motion.div>
  );
}

function BackLink({ installationUuid }: { installationUuid: string }) {
  return (
    <Link href={`/installations/${installationUuid}`}>
      <Button variant="ghost" size="sm" className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </Link>
  );
}
