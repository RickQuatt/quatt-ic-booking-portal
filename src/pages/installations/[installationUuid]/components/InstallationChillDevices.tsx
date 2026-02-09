import { Link } from "wouter";
import type { components } from "@/openapi-client/types/api/v1";
import { CardContainer, DataRow } from "@/components/shared/DetailPage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { useChillDevices } from "../hooks/useChillDevices";
import {
  formatRunningMode,
  formatFourWayValveReversed,
  formatTemperature,
  formatRPM,
  formatPercentage,
  formatBooleanStatus,
  formatWaterFlowStatus,
  formatDeviceStatus,
  formatOnOffStatus,
  formatSystemFailures,
  formatSystemProtections,
  formatSystemFailuresList,
  formatSystemProtectionsList,
} from "../utils/chillDeviceFormatters";

type AdminInstallationDetail = components["schemas"]["AdminInstallationDetail"];
type ChillDevice = components["schemas"]["ChillDevice"];

export interface InstallationChillDevicesProps {
  installation: AdminInstallationDetail;
  installationUuid: string;
}

interface ChillDeviceCardProps {
  device: ChillDevice;
  installationUuid: string;
  index: number;
}

function ChillDeviceCard({
  device,
  installationUuid,
  index,
}: ChillDeviceCardProps) {
  const { metrics } = device;
  const deviceName = device.name || device.serialNumber;
  const title = `🌡️ Chill Device${index > 0 ? ` #${index + 1}` : ""} - ${deviceName}`;

  return (
    <CardContainer title={title}>
      <Accordion type="multiple" className="space-y-2">
        {/* Device Information Section */}
        <AccordionItem
          value="device-info"
          className="rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="font-semibold">Device Information</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-1">
              <DataRow label="Serial Number" value={device.serialNumber} />
              <DataRow
                label="EUI-64 (Thread Network ID)"
                value={device.eui64}
              />
              <DataRow
                label="PCB Hardware Version"
                value={device.pcbHwVersion}
              />
              <DataRow
                label="Device Status"
                value={formatDeviceStatus(device.status)}
              />
              <div className="pt-2">
                <Link
                  href={`/replace-chill-interface-board?installationUuid=${installationUuid}&deviceUuid=${device.uuid}`}
                >
                  <Button variant="outline" size="sm">
                    Replace Interface Board
                  </Button>
                </Link>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* System State Section */}
        {metrics && (
          <AccordionItem
            value="system-state"
            className="rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">System State</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-1">
                <DataRow
                  label="Running Mode"
                  value={formatRunningMode(metrics.runningMode)}
                />
                <DataRow
                  label="Compressor Status"
                  value={formatOnOffStatus(metrics.compressorEnabled)}
                />
                <DataRow
                  label="Operating Mode (4-Way Valve)"
                  value={formatFourWayValveReversed(
                    metrics.fourWayValveReversed,
                  )}
                />
                <DataRow
                  label="Solenoid Valve Status"
                  value={formatOnOffStatus(metrics.solenoidValveEnabled)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Temperature & Environmental Section */}
        {metrics && (
          <AccordionItem
            value="temperature"
            className="rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">Temperature & Environmental</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-1">
                <DataRow
                  label="Inlet Water Temperature"
                  value={formatTemperature(metrics.inletChTemperature)}
                />
                <DataRow
                  label="Outlet Water Temperature"
                  value={formatTemperature(metrics.outletChTemperature)}
                />
                <DataRow
                  label="Ambient Air Temperature"
                  value={formatTemperature(metrics.ambientTemperature)}
                />
                <DataRow
                  label="Humidity"
                  value={formatPercentage(metrics.humidityPercentage)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Fan & Pump Control Section */}
        {metrics && (
          <AccordionItem
            value="fan-pump"
            className="rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">Fan & Pump Control</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-1">
                <DataRow
                  label="Fan Speed"
                  value={formatRPM(metrics.fanActualSpeedRPM)}
                />
                <DataRow
                  label="Pump Speed"
                  value={formatRPM(metrics.pumpFeedbackSpeedRPM)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* System Status Section */}
        {metrics && (
          <AccordionItem
            value="system-status"
            className="rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">System Status</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-1">
                <DataRow
                  label="Water Flow Status"
                  value={formatWaterFlowStatus(metrics.waterFlowSwitchClosed)}
                />
                <DataRow
                  label="Condensation Tank"
                  value={formatBooleanStatus(metrics.condensationTankPresent, {
                    trueLabel: "Present",
                    falseLabel: "Not Present",
                  })}
                />
                <DataRow
                  label="System Failures"
                  value={formatSystemFailures(metrics.systemFailures)}
                />
                {metrics.systemFailures &&
                  metrics.systemFailures.length > 0 && (
                    <div className="mt-2 rounded bg-red-50 p-3 dark:bg-red-900/20">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-red-800 dark:text-red-200">
                        {formatSystemFailuresList(metrics.systemFailures)}
                      </pre>
                    </div>
                  )}
                <DataRow
                  label="System Protections"
                  value={formatSystemProtections(metrics.systemProtections)}
                />
                {metrics.systemProtections &&
                  metrics.systemProtections.length > 0 && (
                    <div className="mt-2 rounded bg-yellow-50 p-3 dark:bg-yellow-900/20">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-yellow-800 dark:text-yellow-200">
                        {formatSystemProtectionsList(metrics.systemProtections)}
                      </pre>
                    </div>
                  )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* No Metrics Available */}
        {!metrics && (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            Metrics data not available for this device.
          </div>
        )}
      </Accordion>
    </CardContainer>
  );
}

/**
 * Installation Chill Devices Component
 * Displays comprehensive chill device information with accordion sections
 */
export function InstallationChillDevices({
  installation,
  installationUuid,
}: InstallationChillDevicesProps) {
  const { chillDevices } = useChillDevices(installation);

  if (!chillDevices || chillDevices.length === 0) {
    return null;
  }

  return (
    <>
      {chillDevices.map((device, index) => (
        <ChillDeviceCard
          key={device.uuid}
          device={device}
          installationUuid={installationUuid}
          index={index}
        />
      ))}
    </>
  );
}
