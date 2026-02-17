import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Tick } from "../types/insights.types";
import { CHART_COLORS } from "../utils/insightsConstants";
import { formatPowerString } from "../utils/insightsFormatting";
import { HeatDistributionChart } from "./HeatDistributionChart";

interface CentralHeatingSectionProps {
  tickValues: Tick[];
  largestBarValue: number;
  hpPercentage: number | null;
  quattHeatProduced?: number;
  quattElectricityConsumed?: number;
  boilerHeatProduced?: number;
  isHidden: boolean;
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="flex h-full transition-all duration-500"
          style={{ width: "100%" }}
        >
          <div
            className="h-full rounded-l-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: CHART_COLORS.hpHeatBorder,
            }}
          />
          <div
            className="h-full rounded-r-full"
            style={{
              width: `${100 - percentage}%`,
              backgroundColor: CHART_COLORS.boilerBorder,
            }}
          />
        </div>
      </div>
      <span className="min-w-[40px] text-sm font-medium">{percentage}%</span>
    </div>
  );
}

function StatLine({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      <span>
        <span className="font-medium">{value}</span>{" "}
        <span className="text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function ChartLegend({ hasBoiler }: { hasBoiler: boolean }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: CHART_COLORS.hpHeatBorder }}
        />
        <span>Heat</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: CHART_COLORS.hpElectricBorder }}
        />
        <span>Electricity used</span>
      </div>
      {hasBoiler && (
        <div className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: CHART_COLORS.boilerBorder }}
          />
          <span>Gas boiler</span>
        </div>
      )}
    </div>
  );
}

export function CentralHeatingSection({
  tickValues,
  largestBarValue,
  hpPercentage,
  quattHeatProduced,
  quattElectricityConsumed,
  boilerHeatProduced,
  isHidden,
}: CentralHeatingSectionProps) {
  if (isHidden) return null;

  const hasBoiler = boilerHeatProduced != null && boilerHeatProduced > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Central Heating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        {hpPercentage != null && <ProgressBar percentage={hpPercentage} />}

        {/* Stats */}
        <div className="space-y-1.5">
          {quattHeatProduced != null && quattHeatProduced > 0 && (
            <StatLine
              color={CHART_COLORS.hpHeatBorder}
              label="heat delivered by Quatt"
              value={formatPowerString(quattHeatProduced)}
            />
          )}
          {quattElectricityConsumed != null && quattElectricityConsumed > 0 && (
            <StatLine
              color={CHART_COLORS.hpElectricBorder}
              label="electricity used"
              value={formatPowerString(quattElectricityConsumed)}
            />
          )}
          {hasBoiler && (
            <StatLine
              color={CHART_COLORS.boilerBorder}
              label="gas boiler"
              value={formatPowerString(boilerHeatProduced)}
            />
          )}
        </div>

        {/* Chart */}
        <HeatDistributionChart
          tickValues={tickValues}
          largestBarValue={largestBarValue}
        />

        {/* Legend */}
        <ChartLegend hasBoiler={hasBoiler} />
      </CardContent>
    </Card>
  );
}
