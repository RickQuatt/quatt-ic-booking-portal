import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import type { Tick } from "../types/insights.types";
import { CHART_COLORS } from "../utils/insightsConstants";
import { formatPower } from "../utils/insightsFormatting";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface HeatDistributionChartProps {
  tickValues: Tick[];
  largestBarValue: number;
}

export function HeatDistributionChart({
  tickValues,
  largestBarValue,
}: HeatDistributionChartProps) {
  const chartData = useMemo(
    () => ({
      labels: tickValues.map((t) => t.x),
      datasets: [
        {
          label: "HP Electricity",
          data: tickValues.map((t) => t.hpElectric),
          backgroundColor: CHART_COLORS.hpElectric,
          borderColor: CHART_COLORS.hpElectricBorder,
          borderWidth: 1,
        },
        {
          label: "HP Heat",
          data: tickValues.map((t) => t.hpHeat),
          backgroundColor: CHART_COLORS.hpHeat,
          borderColor: CHART_COLORS.hpHeatBorder,
          borderWidth: 1,
        },
        {
          label: "Spacer",
          data: tickValues.map((t) => t.spacer),
          backgroundColor: "transparent",
          borderWidth: 0,
          hoverBackgroundColor: "transparent",
        },
        {
          label: "Boiler Heat",
          data: tickValues.map((t) => t.boilerHeat ?? 0),
          backgroundColor: CHART_COLORS.boiler,
          borderColor: CHART_COLORS.boilerBorder,
          borderWidth: 1,
        },
      ],
    }),
    [tickValues],
  );

  const { label: yAxisLabel } = formatPower(largestBarValue);

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          suggestedMax: largestBarValue * 1.1,
          title: {
            display: true,
            text: yAxisLabel || "Wh",
          },
          grid: {
            color: "rgba(150, 150, 150, 0.15)",
          },
          ticks: {
            callback: (tickValue) => {
              const value = Number(tickValue);
              const { value: formatted } = formatPower(value);
              return formatted;
            },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (tooltipItem) => tooltipItem.dataset.label !== "Spacer",
          callbacks: {
            label: (context) => {
              const label = context.dataset.label;
              const value = context.parsed.y;
              const { value: formatted, label: unit } = formatPower(value);
              return `${label}: ${formatted} ${unit}`;
            },
          },
        },
      },
    }),
    [largestBarValue, yAxisLabel],
  );

  return (
    <div className="h-[320px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
