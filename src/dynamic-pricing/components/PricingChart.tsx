import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import classes from "./PricingChart.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface PricingDataPoint {
  hour: number;
  price: number;
  timestamp: string;
  validFrom: string;
  validTo: string;
}

interface PricingChartProps {
  data: PricingDataPoint[];
  selectedDate: Date;
}

export function PricingChart({ data, selectedDate }: PricingChartProps) {
  const chartData = React.useMemo(() => {
    const labels = data.map(
      (point) => `${point.hour.toString().padStart(2, "0")}:00`,
    );
    const prices = data.map((point) => point.price);

    return {
      labels,
      datasets: [
        {
          label: "Price (€/kWh)",
          data: prices,
          borderColor: "#28a745", // Green color matching the app design
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          borderWidth: 2,
          fill: true,
          stepped: "before" as const, // Show stepped chart - price constant from start of each hour
          tension: 0, // No smoothing for stepped chart
          pointBackgroundColor: "#28a745",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [data]);

  const options = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: "#28a745",
          borderWidth: 1,
          callbacks: {
            label: (context: TooltipItem<"line">) => {
              const dataPoint = data[context.dataIndex];
              const validFromDate = new Date(dataPoint.validFrom);
              const validToDate = new Date(dataPoint.validTo);

              const startTime = validFromDate.toLocaleTimeString("en-US", {
                timeZone: "Europe/Amsterdam",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              const endTime = validToDate.toLocaleTimeString("en-US", {
                timeZone: "Europe/Amsterdam",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

              return `${startTime} - ${endTime}: €${context.parsed.y.toFixed(3)} per kWh`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: "Time (hours)",
            color: "#495057",
            font: {
              size: 12,
              weight: 500,
            },
          },
          grid: {
            color: "#e9ecef",
          },
          ticks: {
            color: "#6c757d",
            maxTicksLimit: 12,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: "€/kWh",
            color: "#495057",
            font: {
              size: 12,
              weight: 500,
            },
          },
          grid: {
            color: "#e9ecef",
          },
          ticks: {
            color: "#6c757d",
            callback: function (value: string | number) {
              return `€${Number(value).toFixed(3)}`;
            },
          },
        },
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
    }),
    [],
  );

  if (!data || data.length === 0) {
    return (
      <div className={classes.noData}>
        <p>
          No pricing data available for {selectedDate.toLocaleDateString()}.
        </p>
      </div>
    );
  }

  return (
    <div className={classes.chartWrapper}>
      <Line data={chartData} options={options} />
    </div>
  );
}
