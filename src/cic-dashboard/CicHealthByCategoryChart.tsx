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
import { CICFilters } from "../cic-list/filters/types";
import { stringifyCICFilters } from "../cic-list/filters/url";
import { navigate } from "wouter/use-location";

const options = {
  indexAxis: "y" as const,
  plugins: {
    title: {
      display: true,
      text: "CIC health per category",
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

const categoryToLabel = {
  cic_software: "CIC software",
  connectivity: "Connectivity",
  controller: "Controller",
  heatpump: "Heatpump",
  io_connectivity: "IO Connectivity",
  settings: "Settings",
  software: "Software",
  updates: "Updates",
};

export function CicHealthByCategoryChart({
  data,
}: {
  data: CicDashboardAggregate["aggregateByCategory"];
}) {
  const chartRef = React.useRef();

  const categories = React.useMemo(() => getKeys(data), [data]);
  const chartData = React.useMemo(() => {
    const labels = categories.map((category) => categoryToLabel[category]);
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
  }, [data, categories]);

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const items = getElementAtEvent(chartRef.current!, event);
      if (!items.length) return;
      const element = items[0];
      const category = categories[element.index];
      const healthCheckStatus = chartData.datasets[element.datasetIndex].status;
      const filter = {
        categoryFilters: { [category]: healthCheckStatus },
      } as CICFilters;

      navigate(`/cicHealth?orderNumber=quatt&${stringifyCICFilters(filter)}`);
    },
    [chartData.datasets, categories],
  );

  return (
    <Bar ref={chartRef} onClick={onClick} options={options} data={chartData} />
  );
}
