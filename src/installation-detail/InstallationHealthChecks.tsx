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
import { useQuery } from "@tanstack/react-query";
import { Loader } from "../ui-components/loader/Loader";
import { roundNumber } from "../utils/number";
import ErrorText from "../ui-components/error-text/ErrorText";

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

const stylesMarginZero = { margin: "0" };

export function InstallationHealthChecks({
  orderNumber,
  cicId,
}: {
  orderNumber: string;
  cicId: string;
}) {
  const apiClient = useApiClient();

  const {
    data: healthCheckData,
    isError,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["installationHealthCheck", orderNumber, cicId],
    queryFn: () =>
      apiClient.adminGetInstallationHealthCheck({
        orderNumber,
        cicId,
      }),
  });
  const chResults = healthCheckData?.result;

  const total = Object.values(chResults?.modeReparation || {}).reduce(
    (acc, value) => acc + Number(value),
    0,
  );

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
              value: roundNumber(
                ((chResults?.modeReparation?.quatt as number) / total) * 100,
                0,
              ),
            },
            {
              status: "Idle" as const,
              label: "Idle",
              value: roundNumber(
                ((chResults?.modeReparation?.idle as number) / total) * 100,
                0,
              ),
            },
            {
              status: "Combo" as const,
              label: "Combo",
              value: roundNumber(
                ((chResults?.modeReparation?.combo as number) / total) * 100,
                0,
              ),
            },
            {
              status: "Boiler" as const,
              label: "Boiler",
              value: roundNumber(
                ((chResults?.modeReparation?.boiler as number) / total) * 100,
                0,
              ),
            },
            {
              status: "AntiFreezeProtection" as const,
              label: "AntiFreezeProtection",
              value: roundNumber(
                ((chResults?.modeReparation?.antiFreezeProtection as number) /
                  total) *
                  100,
                0,
              ),
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
  }, [chResults, total]);

  const emptyModeReperation = Object.values(
    chResults?.modeReparation || {},
  ).every((value) => value === "0");

  if (isPending) {
    return <Loader />;
  }

  return (
    <>
      {isError ? (
        <ErrorText
          text="Failed to fetch health check data for the installation."
          retry={refetch}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h3 style={stylesMarginZero}>Room temperature</h3>
            <h2 style={stylesMarginZero}>
              {chResults?.roomTemperature
                ? `${chResults.roomTemperature} °C`
                : "N/A"}
            </h2>
          </div>
          <div>
            <h3 style={stylesMarginZero}>Room setpoint</h3>
            <h2 style={stylesMarginZero}>
              {chResults?.roomSetpoint ? `${chResults.roomSetpoint} °C` : "N/A"}
            </h2>
          </div>
          <div>
            <h3 style={stylesMarginZero}>Setpoint reached</h3>
            <h2 style={stylesMarginZero}>
              {chResults?.setpointAdherence
                ? `${roundNumber(chResults.setpointAdherence, 1)}%`
                : "N/A"}
            </h2>
          </div>
          <div>
            <h3 style={stylesMarginZero}>Mode repartition</h3>
            {!emptyModeReperation && chResults?.modeReparation ? (
              <div style={{ height: "100px", width: "100px" }}>
                <Pie ref={chartRef} data={chartData} options={options} />
              </div>
            ) : (
              <h2 style={stylesMarginZero}>N/A</h2>
            )}
          </div>
          <div>
            <h3 style={stylesMarginZero}>Supervisory control mode</h3>
            <h2 style={stylesMarginZero}>
              {chResults?.supervisoryControlMode || "N/A"}
            </h2>
          </div>
        </div>
      )}
    </>
  );
}
