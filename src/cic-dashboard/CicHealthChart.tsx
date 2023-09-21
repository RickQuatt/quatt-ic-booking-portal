import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut, getElementAtEvent } from "react-chartjs-2";
import {
  correctBorderColor,
  correctColor,
  errorBorderColor,
  errorColor,
  notApplicableBorderColor,
  notApplicableColor,
  warningBorderColor,
  warningColor,
} from "./colors";
import { CicDashboardAggregate } from "../api-client/models";
import { stringifyCICFilters } from "../cic-list/filters/url";
import { navigate } from "wouter/use-location";

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
  plugins: {
    title: {
      display: true,
      text: "CIC health",
    },
    tooltip: {
      mode: "index",
    },
  },
  responsive: true,
  maintainAspectRatio: false,
} as const;

export function CicHealthAggregateChart({
  data,
}: {
  data: CicDashboardAggregate["aggregate"];
}) {
  const chartRef = React.useRef();
  const chartData = React.useMemo(() => {
    return {
      labels: ["Not applicable", "All good", "Warning", "Error"],
      datasets: [
        {
          data: [
            {
              status: "notApplicable" as const,
              value: data.notApplicable,
              description: "",
            },
            {
              status: "correct" as const,
              value: data.correct,
            },
            {
              status: "warning" as const,
              value: data.warning,
            },
            {
              status: "error" as const,
              value: data.error,
            },
          ],
          backgroundColor: [
            notApplicableColor,
            correctColor,
            warningColor,
            errorColor,
          ],
          borderColor: [
            notApplicableBorderColor,
            correctBorderColor,
            warningBorderColor,
            errorBorderColor,
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const onClick = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const items = getElementAtEvent(chartRef.current!, event);
      if (!items.length) return;
      const element = items[0];
      const healthCheckStatus =
        chartData.datasets[0].data[element.index].status;
      const filter = { healthCheck: healthCheckStatus };

      navigate(`/cicHealth?orderNumber=quatt&${stringifyCICFilters(filter)}`);
    },
    [chartData.datasets],
  );

  return (
    <Doughnut
      ref={chartRef}
      onClick={onClick}
      data={chartData}
      options={options}
    />
  );
}
