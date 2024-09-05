import {
  antiFreezeProtectionColor,
  boilerColor,
  comboColor,
  idleColor,
  quattColor,
} from "../cic-dashboard/colors";
import { InstallationHealthCheckModeReparation } from "../api-client/models";
import { roundNumber } from "../utils/number";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import ThresholdCheck from "../ui-components/threshold-check/ThresholdCheck";

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
  plugins: {
    title: {
      display: false,
      text: "Health checks",
    },
    legend: { display: false },
    tooltip: {
      mode: "index",
      callbacks: {
        label: function (context: any) {
          const value = context.dataset.data[context.dataIndex].value;
          return `${value} %`;
        },
      },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
} as const;

const getChartDataElementForStatus = (
  label: string,
  value: number,
  total: number,
) => ({
  status: label,
  label,
  value: roundNumber(((value as number) / total) * 100, 0),
});

interface InstallationModeReparationProps {
  modeReparation?: InstallationHealthCheckModeReparation | null;
}

function InstallationModeReparation({
  modeReparation,
}: InstallationModeReparationProps) {
  const total = Object.values(modeReparation || {}).reduce(
    (acc, value) => acc + Number(value),
    0,
  );

  const boilerChartData =
    modeReparation &&
    getChartDataElementForStatus("Boiler", modeReparation.boiler, total);

  const chartData = {
    labels: ["Quatt", "Idle", "Combo", "Boiler", "AntiFreezeProtection"],
    datasets: [
      {
        data: modeReparation
          ? [
              getChartDataElementForStatus(
                "Quatt",
                modeReparation.quatt,
                total,
              ),
              getChartDataElementForStatus("Idle", modeReparation.idle, total),
              getChartDataElementForStatus(
                "Combo",
                modeReparation.combo,
                total,
              ),
              boilerChartData,
              getChartDataElementForStatus(
                "AntiFreezeProtection",
                modeReparation.antiFreezeProtection,
                total,
              ),
            ]
          : [],
        backgroundColor: [
          quattColor,
          idleColor,
          comboColor,
          boilerColor,
          antiFreezeProtectionColor,
        ],
      },
    ],
  };

  const boilerUsage = boilerChartData?.value;
  const emptyModeReparation = total === 0;
  const showChart = !emptyModeReparation && modeReparation;

  return (
    <ThresholdCheck
      title="Mode reparation"
      thresholdValue={boilerUsage}
      upperThreshold={70}
      upperThresholdMessage="High boiler usage"
    >
      {showChart && (
        <div style={{ height: "100px", width: "100px" }}>
          <Pie data={chartData} options={options} />
        </div>
      )}
    </ThresholdCheck>
  );
}

export default InstallationModeReparation;
