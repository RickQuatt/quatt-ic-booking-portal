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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

import { Bar, getElementAtEvent } from "react-chartjs-2";
import {
  CicHealthChecksByKpi,
  CicDashboardAggregate,
} from "../api-client/models";
import {
  correctColor,
  errorColor,
  notApplicableColor,
  warningColor,
} from "./colors";
import { getKeys, getValues } from "../utils/object";
import { useLocation } from "wouter";
import { stringifyCICFilters } from "../cic-list/filters/url";
import { CICFilters } from "../cic-list/filters/types";
import { kpiToLabel, labelToKpi } from "../constants";

const options = {
  indexAxis: "y" as const,
  plugins: {
    title: {
      display: true,
      text: "CIC health per KPI",
    },
    tooltip: {
      callbacks: {
        beforeBody: (value: any) => {
          const kpi = labelToKpi[value[0].label] as keyof CicHealthChecksByKpi;

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
              return 'Verify if customer has not disabled the "use tariff-based optimization" feature AND minimum COP based on user tarrifs has a correct value';
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
  },
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
} as const;

export function CicHealthByKpiChart({
  data,
}: {
  data: CicDashboardAggregate["aggregateByKpi"];
}) {
  const [, navigate] = useLocation();
  const chartRef = React.useRef();

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

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const items = getElementAtEvent(chartRef.current!, event);
      if (!items.length) return;
      const element = items[0];
      const kpi = kpis[element.index];
      const healthCheckStatus = chartData.datasets[element.datasetIndex].status;
      const filter = { kpiFilters: { [kpi]: healthCheckStatus } } as CICFilters;

      navigate(`/cicHealth?orderNumber=quatt&${stringifyCICFilters(filter)}`);
    },
    [chartData.datasets, kpis],
  );

  return (
    <Bar ref={chartRef} onClick={onClick} options={options} data={chartData} />
  );
}
