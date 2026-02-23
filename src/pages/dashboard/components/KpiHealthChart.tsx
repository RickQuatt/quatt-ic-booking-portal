import React from "react";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useLocation } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { CardContainer } from "@/components/shared/DetailPage/CardContainer";
import {
  correctColor,
  errorColor,
  notApplicableColor,
  warningColor,
} from "@/lib/chart-colors";
import { getKeys, getValues } from "@/utils/object";
import { kpiToLabel, labelToKpi } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type CicAggregateByKpi = components["schemas"]["CicAggregateByKpi"];

interface KpiHealthChartProps {
  data: CicAggregateByKpi;
}

/**
 * Health by KPI Chart (Horizontal Bar)
 * Shows CIC health broken down by 17 key performance indicators
 */
export function KpiHealthChart({ data }: KpiHealthChartProps) {
  const [, navigate] = useLocation();
  const chartRef = React.useRef();
  const { isDark } = useTheme();

  const textColor = isDark ? "#e5e7eb" : "#374151"; // gray-200 : gray-700

  const options = React.useMemo(
    () => ({
      indexAxis: "y" as const,
      plugins: {
        title: {
          display: false, // Title now in Card header
        },
        tooltip: {
          callbacks: {
            beforeBody: (value: any) => {
              const kpi = labelToKpi[value[0].label] as keyof CicAggregateByKpi;

              switch (kpi) {
                case "validSettings":
                  return "CiC should have valid (non-null) settings in the cloud";
                case "isConnectedAWS":
                  return "CiC is online in Quatt AWS";
                case "isConnectedInternet":
                  return "CiC is connected to Wifi or ethernet (this is only reliable when CiC is online in AWS)";
                case "hasLatestSoftware":
                  return "CIC has the latest software version";
                case "isCommissioned":
                  return "CiC is properly commissioned";
                case "cloudConsistency":
                  return "The following settings should be consistent between CiC and cloud: `thermostatType`, `boilerType`, `numberOfHeatpumps`, `ratedMaximumHousePower`, `maximumHeatingOutdoorTemperature`";
                case "runningController":
                  return "Ensure the correct controller (based on cloud setting) is running";
                case "thermostatConnected":
                  return "Check if a thermostat is connected";
                case "roomTemperatureControl":
                  return "Verify `thermostatType` setting in the cloud is correct";
                case "openthermBoilerConnected":
                  return "Verify `boilerType` setting in the cloud, and that an OT boiler is connected";
                case "heatpumpsConnected":
                  return "Check if (correct number of) heatpumps are connected";
                case "cpuTemperature":
                  return "Last value of CPU temperature is within the defined limits";
                case "loadAverage":
                  return "Last value of load average is within the defined limits";
                case "watchdog":
                  return "Last value of watchdog code is within the defined limits";
                case "minimumCop":
                  return "Green: tariff COP optimization is active. Warning: heat pump currently limited (boiler is cheaper). Error: minimumCOP not set (tariff optimization disabled or not configured).";
                case "supervisoryControlMode":
                  return "Controller is in normal operation mode";
                case "heatpumpErrors":
                  return "Check if the heatpump(s) reports any errors";
                case "numberOfRestarts":
                  return "Check estimated number of restarts in the last 24 hours";
              }
            },
          },
        },
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          ticks: { color: textColor },
          grid: { display: false },
        },
        y: {
          stacked: true,
          ticks: { color: textColor },
          grid: { display: false },
        },
      },
    }),
    [textColor],
  );

  const kpis = React.useMemo(() => getKeys(data), [data]);

  const chartData = React.useMemo(() => {
    const labels = kpis.map((key) => kpiToLabel[key]);
    const datasets = getValues(data).reduce(
      (acc, data) => {
        acc.correct.push(data.correct);
        acc.warning.push(data.warning);
        acc.error.push(data.error);
        acc.notApplicable.push(data.notApplicable);
        return acc;
      },
      {
        correct: [] as number[],
        warning: [] as number[],
        error: [] as number[],
        notApplicable: [] as number[],
      },
    );

    return {
      datasets: [
        {
          label: "Not applicable",
          status: "notApplicable" as const,
          data: datasets.notApplicable,
          backgroundColor: notApplicableColor,
        },
        {
          label: "All good",
          status: "correct" as const,
          data: datasets.correct,
          backgroundColor: correctColor,
        },
        {
          label: "Warning",
          status: "warning" as const,
          data: datasets.warning,
          backgroundColor: warningColor,
        },
        {
          label: "Error",
          status: "error" as const,
          data: datasets.error,
          backgroundColor: errorColor,
        },
      ],
      labels,
    };
  }, [kpis, data]);

  return (
    <CardContainer title="CIC Health per KPI" className="h-full">
      <div className="h-[800px]">
        <Bar ref={chartRef} options={options} data={chartData} />
      </div>
    </CardContainer>
  );
}
