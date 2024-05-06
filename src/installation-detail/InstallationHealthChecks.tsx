import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import {
  antiFreezeProtectionColor,
  boilerColor,
  comboColor,
  idleColor,
  quattColor,
} from "../cic-dashboard/colors";
import { useApiClient } from "../api-client/context";
import { useQuery } from "react-query";
import { Loader } from "../ui-components/loader/Loader";
import { roundNumber } from "../utils/number";

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
          return `${value}`;
        },
      },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
} as const;

export function InstallationHealthChecks({
  installationId,
}: {
  installationId: string;
}) {
  const apiClient = useApiClient();

  const { data: chData, status: chStatus } = useQuery(
    ["installationClickHouseData", installationId],
    () => {
      return apiClient.adminGetInstallationClickhouseData({
        installationId: installationId,
      });
    },
  );
  const chResults = chData?.result;

  const chartRef = React.useRef();
  const chartData = React.useMemo(() => {
    return {
      labels: ["Quatt", "Idle", "Combo", "Boiler", "AntiFreezeProtection"],
      datasets: [
        {
          data: [
            {
              status: "Quatt",
              label: "Quatt",
              value: chResults?.modeReparation?.quatt,
              description: "hoi",
            },
            {
              status: "Idle" as const,
              label: "Idle",
              value: chResults?.modeReparation?.idle,
              description: "",
            },
            {
              status: "Combo" as const,
              label: "Combo",
              value: chResults?.modeReparation?.combo,
            },
            {
              status: "Boiler" as const,
              label: "Boiler",
              value: chResults?.modeReparation?.boiler,
            },
            {
              status: "AntiFreezeProtection" as const,
              label: "AntiFreezeProtection",
              value: chResults?.modeReparation?.antiFreezeProtection,
            },
          ],
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
  }, [chResults]);

  const emptyModeReperation = Object.values(
    chResults?.modeReparation || {},
  ).every((value) => value === "0");

  return (
    <>
      {chStatus === "error" && (
        <div style={{ textAlign: "center" }}>No Health checks 😴</div>
      )}
      {chStatus === "loading" ? (
        <Loader />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0" }}>Room temperature</h3>
              <h2 style={{ margin: "0" }}>
                {chResults?.roomTemperature
                  ? `${chResults.roomTemperature} °C`
                  : "N/A"}
              </h2>
            </div>
            <div>
              <h3 style={{ margin: "0" }}>Room setpoint</h3>
              <h2 style={{ margin: "0" }}>
                {chResults?.roomSetpoint
                  ? `${chResults.roomSetpoint} °C`
                  : "N/A"}
              </h2>
            </div>
            <div>
              <h3 style={{ margin: "0" }}>Setpoint reached</h3>
              <h2 style={{ margin: "0" }}>
                {chResults?.setpointAdherence
                  ? `${roundNumber(chResults.setpointAdherence, 1)}%`
                  : "N/A"}
              </h2>
            </div>
            <div>
              <h3 style={{ margin: "0" }}>Mode reparation</h3>
              {!emptyModeReperation && chResults?.modeReparation ? (
                <div style={{ height: "100px", width: "100px" }}>
                  <Pie ref={chartRef} data={chartData} options={options} />
                </div>
              ) : (
                <h2 style={{ margin: "0" }}>N/A</h2>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
