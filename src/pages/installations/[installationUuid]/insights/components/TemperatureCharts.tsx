import { useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { format } from "date-fns";
import type {
  InsightsResponse,
  TimeGranularity,
} from "../types/insights.types";
import { CHART_COLORS } from "../utils/insightsConstants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
);

interface OutsideTemperatureChartProps {
  data: NonNullable<InsightsResponse["outsideTemperatureGraph"]>;
  timeGranularity: TimeGranularity;
}

export function OutsideTemperatureChart({
  data,
  timeGranularity,
}: OutsideTemperatureChartProps) {
  const validData = data.filter(Boolean);
  const isDay = timeGranularity === "day";

  const chartData = useMemo(() => {
    if (validData.length === 0) return null;

    // Format labels based on time granularity
    const getLabelFormat = () => {
      switch (timeGranularity) {
        case "day":
          return "HH:mm"; // Hourly
        case "week":
          return "EEE"; // Weekday (Mon, Tue, Wed)
        case "month":
          return "d"; // Day of month (1, 2, 3, ...)
        case "year":
          return "MMM"; // Month abbreviation (Jan, Feb, Mar)
        case "all":
          return "yyyy"; // Year (2024, 2025)
        default:
          return "EEE";
      }
    };

    const labels = validData.map((d) =>
      d ? format(new Date(d.timestamp), getLabelFormat()) : "",
    );

    if (isDay) {
      return {
        labels,
        datasets: [
          {
            label: "Temperature",
            data: validData.map((d) => d?.temperatureOutside ?? null),
            borderColor: CHART_COLORS.tempMild,
            backgroundColor: "rgba(0, 204, 136, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: "Temperature Range",
          data: validData.map((d) =>
            d?.minTemperatureOutside != null && d?.maxTemperatureOutside != null
              ? [d.minTemperatureOutside, d.maxTemperatureOutside]
              : null,
          ) as ([number, number] | null)[],
          backgroundColor: (context: ScriptableContext<"bar">) => {
            // Create gradient from cold (blue) to warm (yellow)
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return CHART_COLORS.tempCold;

            const gradient = ctx.createLinearGradient(
              0,
              chartArea.bottom,
              0,
              chartArea.top,
            );
            gradient.addColorStop(0, CHART_COLORS.tempCold);
            gradient.addColorStop(1, CHART_COLORS.tempWarm);
            return gradient;
          },
          borderWidth: 0,
          borderSkipped: false,
        },
      ],
    };
  }, [validData, isDay]);

  const lineOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        },
        y: {
          title: { display: true, text: "°C" },
          grid: { color: "rgba(150, 150, 150, 0.15)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y?.toFixed(1)}°C`,
          },
        },
      },
    }),
    [],
  );

  const barOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        },
        y: {
          title: { display: true, text: "°C" },
          grid: { color: "rgba(150, 150, 150, 0.15)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const dataIndex = context.dataIndex;
              const dataPoint = validData[dataIndex];

              if (!dataPoint) return "";

              const min = dataPoint.minTemperatureOutside?.toFixed(1);
              const max = dataPoint.maxTemperatureOutside?.toFixed(1);

              return `${min}°C - ${max}°C`;
            },
            title: (tooltipItems) => {
              return tooltipItems[0]?.label || "";
            },
          },
        },
      },
    }),
    [validData],
  );

  if (!chartData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Outside Temperature</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          {isDay ? (
            <Line
              data={chartData as Parameters<typeof Line>[0]["data"]}
              options={lineOptions}
            />
          ) : (
            <Bar
              data={chartData as Parameters<typeof Bar>[0]["data"]}
              options={barOptions}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RoomTemperatureChartProps {
  data: NonNullable<InsightsResponse["roomTemperatureGraph"]>;
}

export function RoomTemperatureChart({ data }: RoomTemperatureChartProps) {
  const validData = data.filter(Boolean);

  const chartData = useMemo(() => {
    if (validData.length === 0) return null;
    return {
      labels: validData.map((d) =>
        d ? format(new Date(d.timestamp), "HH:mm") : "",
      ),
      datasets: [
        {
          label: "Room Temperature",
          data: validData.map((d) => d?.roomTemperature ?? null),
          borderColor: CHART_COLORS.roomTemp,
          backgroundColor: "rgba(0, 206, 209, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: "Setpoint",
          data: validData.map((d) => d?.roomSetpoint ?? null),
          borderColor: CHART_COLORS.roomSetpoint,
          borderDash: [5, 5],
          fill: false,
          tension: 0,
          pointRadius: 0,
        },
      ],
    };
  }, [validData]);

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        },
        y: {
          title: { display: true, text: "°C" },
          grid: { color: "rgba(150, 150, 150, 0.15)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y?.toFixed(1)}°C`,
          },
        },
      },
    }),
    [],
  );

  if (!chartData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Room Temperature</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <Line data={chartData} options={options} />
        </div>
        <div className="mt-2 flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-4 rounded"
              style={{ backgroundColor: CHART_COLORS.roomTemp }}
            />
            <span>Room temp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-0.5 w-4 border-t-2 border-dashed"
              style={{ borderColor: CHART_COLORS.roomSetpoint }}
            />
            <span>Setpoint</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface WaterTemperatureChartProps {
  data: NonNullable<InsightsResponse["waterTemperatureGraph"]>;
}

export function WaterTemperatureChart({ data }: WaterTemperatureChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;
    return {
      labels: data.map((d) =>
        d ? format(new Date(d.timestamp), "HH:mm") : "",
      ),
      datasets: [
        {
          label: "Water Temperature",
          data: data.map((d) => d?.waterTemperature ?? null),
          borderColor: CHART_COLORS.waterTemp,
          backgroundColor: "rgba(255, 140, 66, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: CHART_COLORS.waterTemp,
          spanGaps: false, // Show gaps for missing data
        },
      ],
    };
  }, [data]);

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        },
        y: {
          title: { display: true, text: "°C" },
          grid: { color: "rgba(150, 150, 150, 0.15)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y?.toFixed(1)}°C`,
          },
        },
      },
    }),
    [],
  );

  if (!chartData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Water Temperature</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <Line data={chartData} options={options} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Water temperature data may be sparse as it is only recorded during
          heating cycles.
        </p>
      </CardContent>
    </Card>
  );
}
