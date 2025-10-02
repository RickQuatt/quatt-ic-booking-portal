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
import { PricingDataPoint } from "../../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface PricingChartProps {
  data: PricingDataPoint[];
  selectedDate: Date;
  currentGasPrice?: number;
}

export function PricingChart({
  data,
  selectedDate,
  currentGasPrice,
}: PricingChartProps) {
  // Gas calorific value in kWh/m³ (same as backend: 8.79 kWh/m³)
  const HEAT_FROM_M3_OF_GAS = 8.7925; // kWh/m³

  const chartData = React.useMemo(() => {
    const labels = data.map((point) => point.formattedValidFrom);
    const prices = data.map((point) => point.price);

    const datasets: any[] = [
      {
        label: "Electricity Price (€/kWh)",
        data: prices,
        borderColor: "#28a745", // Green color matching the app design
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        borderWidth: 2,
        fill: true,
        stepped: "before" as const, // Show stepped chart - price constant from start of each hour
        tension: 0, // No smoothing for stepped chart
        pointRadius: 0,
        pointHoverRadius: 0,
        yAxisID: "y",
      },
    ];

    // Add COP switching line if we have gas price
    if (currentGasPrice) {
      // Calculate COP for switching at each time point
      // COP = electricityPrice_€/kWh / (gasPrice_€/m³ / heatFromM3OfGas_kWh/m³)
      // Simplified: COP = (electricityPrice_€/kWh × heatFromM3OfGas_kWh/m³) / gasPrice_€/m³
      const copValues = prices.map((electricityPrice) => {
        return (electricityPrice * HEAT_FROM_M3_OF_GAS) / currentGasPrice;
      });

      datasets.push({
        label: "COP Switching Point",
        data: copValues,
        borderColor: "#ff6b35", // Orange color for COP line
        backgroundColor: "transparent",
        borderWidth: 2,
        fill: false,
        stepped: "before" as const,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        yAxisID: "y1", // Use secondary y-axis for COP values
      });
    }

    return {
      labels,
      datasets,
    };
  }, [data, currentGasPrice]);

  const options = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: currentGasPrice ? true : false,
          position: "top" as const,
          labels: {
            usePointStyle: true,
            padding: 15,
          },
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
              if (context.datasetIndex === 0) {
                // Electricity price dataset
                const dataPoint = data[context.dataIndex];
                return `${dataPoint.formattedValidFrom} - ${dataPoint.formattedValidTo}: €${context.parsed.y.toFixed(3)} per kWh`;
              } else {
                // COP switching line - return array for multiple lines
                const copValue = context.parsed.y;
                return [
                  `COP switching point: ${copValue.toFixed(2)}`,
                  `(heat pump COP must be > ${copValue.toFixed(2)} to be cheaper than gas)`,
                ];
              }
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
          type: "linear" as const,
          display: true,
          position: "left" as const,
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
        y1: {
          type: "linear" as const,
          display: currentGasPrice ? true : false,
          position: "right" as const,
          beginAtZero: true,
          title: {
            display: true,
            text: "COP",
            color: "#ff6b35",
            font: {
              size: 12,
              weight: 500,
            },
          },
          grid: {
            drawOnChartArea: false, // Don't draw grid lines for secondary axis
          },
          ticks: {
            color: "#ff6b35",
            callback: function (value: string | number) {
              return Number(value).toFixed(1);
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
    [data, currentGasPrice],
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
