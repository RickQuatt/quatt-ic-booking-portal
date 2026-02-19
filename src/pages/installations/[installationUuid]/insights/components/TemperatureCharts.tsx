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
import { format, addHours, addDays, addMonths, addYears } from "date-fns";
import type {
  InsightsResponse,
  TimeGranularity,
} from "../types/insights.types";
import { CHART_COLORS, INSIGHTS_TIME_UNITS } from "../utils/insightsConstants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
);

/**
 * Helper to add units based on time unit type
 */
function addUnits(
  date: Date,
  amount: number,
  unit: "hour" | "day" | "week" | "month" | "year",
): Date {
  switch (unit) {
    case "hour":
      return addHours(date, amount);
    case "day":
      return addDays(date, amount);
    case "week":
      return addDays(date, amount * 7);
    case "month":
      return addMonths(date, amount);
    case "year":
      return addYears(date, amount);
  }
}

/**
 * Helper to check if two dates match for the given unit
 */
function isSameUnit(
  a: Date,
  b: Date,
  unit: "hour" | "day" | "week" | "month" | "year",
): boolean {
  const formatMap = {
    hour: "yyyy-MM-dd HH",
    day: "yyyy-MM-dd",
    week: "yyyy-MM-dd",
    month: "yyyy-MM",
    year: "yyyy",
  };
  return format(a, formatMap[unit]) === format(b, formatMap[unit]);
}

/**
 * Calculate the number of ticks for the full period
 */
function getNumTicks(timeGranularity: TimeGranularity, fromDate: Date): number {
  switch (timeGranularity) {
    case "day":
      return 24; // 24 hours
    case "week":
      return 7; // 7 days
    case "month": {
      const year = fromDate.getFullYear();
      const month = fromDate.getMonth();
      return new Date(year, month + 1, 0).getDate();
    }
    case "year":
      return 12; // 12 months
    case "all": {
      const now = new Date();
      return (
        Math.floor(
          (now.getTime() - fromDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
        ) + 1
      );
    }
  }
}

interface OutsideTemperatureChartProps {
  data: NonNullable<InsightsResponse["outsideTemperatureGraph"]>;
  timeGranularity: TimeGranularity;
}

export function OutsideTemperatureChart({
  data,
  timeGranularity,
}: OutsideTemperatureChartProps) {
  const isDay = timeGranularity === "day";

  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    // Find first valid entry to get the start date
    const firstEntry = data.find((d) => d);
    if (!firstEntry) return null;

    const fromDate = new Date(firstEntry.timestamp);
    const timeUnit = INSIGHTS_TIME_UNITS[timeGranularity];
    const numTicks = getNumTicks(timeGranularity, fromDate);

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

    const labelFormat = getLabelFormat();

    // Generate full period labels and match data
    const labels: string[] = [];
    const temperatures: (number | null)[] = [];
    const minTemps: (number | null)[] = [];
    const maxTemps: (number | null)[] = [];

    for (let i = 0; i < numTicks; i++) {
      const tickDate = addUnits(fromDate, i, timeUnit);
      labels.push(format(tickDate, labelFormat));

      // Find matching data point
      const dataPoint = data.find(
        (d) => d && isSameUnit(new Date(d.timestamp), tickDate, timeUnit),
      );

      temperatures.push(dataPoint?.temperatureOutside ?? null);
      minTemps.push(dataPoint?.minTemperatureOutside ?? null);
      maxTemps.push(dataPoint?.maxTemperatureOutside ?? null);
    }

    if (isDay) {
      return {
        labels,
        datasets: [
          {
            label: "Temperature",
            data: temperatures,
            borderColor: CHART_COLORS.tempMild,
            backgroundColor: "rgba(0, 204, 136, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            spanGaps: true,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: "Temperature Range",
          data: minTemps.map((min, idx) => {
            const max = maxTemps[idx];
            return min != null && max != null ? [min, max] : null;
          }) as ([number, number] | null)[],
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
  }, [data, timeGranularity, isDay]);

  const lineOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 24 },
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
              const value = context.parsed.y;
              if (value == null) return "";
              return `${context.dataset.label}: ${value.toFixed(1)}°C`;
            },
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
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 24 },
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
              const value = context.parsed.y;

              if (!value || !Array.isArray(value)) return "";

              const [min, max] = value;
              return `${min?.toFixed(1)}°C - ${max?.toFixed(1)}°C`;
            },
            title: (tooltipItems) => {
              return tooltipItems[0]?.label || "";
            },
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
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    // Find first valid entry to get the start date
    const firstEntry = data.find((d) => d);
    if (!firstEntry) return null;

    const fromDate = new Date(firstEntry.timestamp);
    const numTicks = 24; // Always 24 hours for day view

    // Generate full period (24 hours)
    const labels: string[] = [];
    const roomTemps: (number | null)[] = [];
    const setpoints: (number | null)[] = [];

    for (let i = 0; i < numTicks; i++) {
      const tickDate = addHours(fromDate, i);
      labels.push(format(tickDate, "HH:mm"));

      // Find matching data point
      const dataPoint = data.find(
        (d) => d && isSameUnit(new Date(d.timestamp), tickDate, "hour"),
      );

      roomTemps.push(dataPoint?.roomTemperature ?? null);
      setpoints.push(dataPoint?.roomSetpoint ?? null);
    }

    return {
      labels,
      datasets: [
        {
          label: "Room Temperature",
          data: roomTemps,
          borderColor: CHART_COLORS.roomTemp,
          backgroundColor: "rgba(0, 206, 209, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          spanGaps: true,
        },
        {
          label: "Setpoint",
          data: setpoints,
          borderColor: CHART_COLORS.roomSetpoint,
          borderDash: [5, 5],
          fill: false,
          tension: 0,
          pointRadius: 0,
          spanGaps: true,
        },
      ],
    };
  }, [data]);

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 24 },
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
              const value = context.parsed.y;
              if (value == null) return "";
              return `${context.dataset.label}: ${value.toFixed(1)}°C`;
            },
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

    // Find first valid entry to get the start date
    const firstEntry = data.find((d) => d);
    if (!firstEntry) return null;

    const fromDate = new Date(firstEntry.timestamp);
    const numTicks = 24; // Always 24 hours for day view

    // Generate full period (24 hours)
    const labels: string[] = [];
    const waterTemps: (number | null)[] = [];

    for (let i = 0; i < numTicks; i++) {
      const tickDate = addHours(fromDate, i);
      labels.push(format(tickDate, "HH:mm"));

      // Find matching data point
      const dataPoint = data.find(
        (d) => d && isSameUnit(new Date(d.timestamp), tickDate, "hour"),
      );

      waterTemps.push(dataPoint?.waterTemperature ?? null);
    }

    return {
      labels,
      datasets: [
        {
          label: "Water Temperature",
          data: waterTemps,
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
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 24 },
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
              const value = context.parsed.y;
              if (value == null) return "";
              return `${context.dataset.label}: ${value.toFixed(1)}°C`;
            },
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
