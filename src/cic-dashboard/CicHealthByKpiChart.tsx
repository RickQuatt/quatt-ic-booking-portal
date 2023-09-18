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
import { CicDashboardAggregate } from "../api-client/models";
import {
  correctColor,
  errorColor,
  notApplicableColor,
  warningColor,
} from "./colors";
import { getKeys, getValues } from "../utils/object";
import { navigate } from "wouter/use-location";
import { stringifyCICFilters } from "../cic-list/filters/url";
import { CICFilters } from "../cic-list/filters/types";

const options = {
  indexAxis: "y" as const,
  plugins: {
    title: {
      display: true,
      text: "CIC health per KPI",
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
};

export const kpiToLabel = {
  validSettings: "Cloud settings",
  isConnectedAWS: "Is online",
  isConnectedInternet: "Is connected to Wifi or Ethernet",
  hasLatestSoftware: "Has latest software version",
  isCommissioned: "Is commissioned",
  cloudConsistency: "Cloud settings consistency",
  runningController: "Correct controller running",
  thermostatConnected: "Thermostat connected",
  roomTemperatureControl: "Room temperature control",
  openthermBoilerConnected: "Opentherm boiler connected",
  heatpumpsConnected: "Heatpumps connected",
  cpuTemperature: "CPU temperature",
  loadAverage: "Load average",
  watchdog: "Watchdog",
  minimumCop: "Minimum COP is too high",
  supervisoryControlMode: "Controller in normal operation",
  heatpumpErrors: "Error flag from heatpump",
  numberOfRestarts: "Number of restarts",
};

export function CicHealthByKpiChart({
  data,
}: {
  data: CicDashboardAggregate["aggregateByKpi"];
}) {
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
