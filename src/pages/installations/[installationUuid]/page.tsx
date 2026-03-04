import { useState } from "react";
import type { components } from "@/openapi-client/types/api/v1";
import { motion } from "framer-motion";

type AdminInstallationDetail = components["schemas"]["AdminInstallationDetail"];
import { fadeInVariants } from "@/lib/animations";
import { useResponsiveLayout } from "@/hooks/detail-page";
import {
  InstallationHeader,
  InstallationSidebarActions,
  InstallationJsonCard,
  InstallationDeviceInfoCard,
  InstallationHealthCard,
  InstallationSidebarCommissioning,
  InstallationEvents,
  InstallationSettingsModal,
  InstallationSettingsHistory,
  InstallationCicHistory,
  InstallationTickets,
  InstallationTariffs,
  InstallationSnowflake,
  InstallationNotes,
  InstallationCommissioning,
  InstallationHomeBattery,
  InstallationChillDevices,
  InstallationDongleDevices,
  InstallationZuperService,
  InstallationQRCodes,
} from "./components";
import { CardContainer } from "@/components/shared/DetailPage";
import useRebootCic from "@/pages/cics/[cicId]/hooks/useRebootDevice";

export interface InstallationDetailPageProps {
  installation: AdminInstallationDetail;
  installationUuid: string;
  isLoading?: boolean;
}

// Version check for reboot support
const versionSupportsReboot = (version: string | null) => {
  if (!version) return false;
  const [major, minor] = version.split(".").map(Number);
  return major > 2 || (major === 2 && minor >= 16);
};

/**
 * Installation Detail Page - Redesigned
 * Two-column responsive layout with sticky header
 * Primary content (70%) | Sidebar (30%)
 */
export function InstallationDetailPage({
  installation,
  installationUuid,
  isLoading = false,
}: InstallationDetailPageProps) {
  const layoutMode = useResponsiveLayout();
  const isMobile = layoutMode !== "desktop";
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isZuperEnabled, setIsZuperEnabled] = useState(false);

  const rebootCic = useRebootCic(installation.activeCic || "", "cic");

  const isRebootDisabled =
    !installation.activeCic || !versionSupportsReboot(installation.quattBuild);
  const rebootLabel = isRebootDisabled
    ? "Reboot not supported by CIC version"
    : "Reboot CIC";

  const isAllE = installation.type?.includes("ALL_ELECTRIC") || false;

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <InstallationHeader installation={installation} isLoading={isLoading} />

      {/* Main Content */}
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="animate"
        className="container mx-auto px-4 py-6"
      >
        {/* Mobile: Quick Actions First */}
        {isMobile && (
          <div className="mb-6">
            <InstallationSidebarActions
              installation={installation}
              installationUuid={installationUuid}
              onRebootCIC={rebootCic}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              isRebootDisabled={isRebootDisabled}
              rebootLabel={rebootLabel}
              isLoading={isLoading}
            />
          </div>
        )}

        <div
          className={`grid gap-6 ${
            isMobile ? "grid-cols-1" : "lg:grid-cols-[1fr_400px]"
          }`}
        >
          {/* Primary Content Column */}
          <div className="space-y-6">
            {/* General Information */}
            <CardContainer title="General Information">
              <InstallationDeviceInfoCard installation={installation} />
            </CardContainer>

            {/* Health Overview - Always Expanded */}
            {installation.activeCic && (
              <CardContainer title="Health Checks">
                <InstallationHealthCard
                  installationUuid={installationUuid}
                  isAllE={isAllE}
                  cicId={installation.activeCic}
                  thermostatType={installation.thermostatType}
                  deviceConnectionStatuses={
                    installation.deviceConnectionStatuses
                  }
                  internetConnectionStatuses={
                    installation.internetConnectionStatuses
                  }
                  boilerType={installation.boilerType}
                  numberOfHeatPumps={installation.numberOfHeatPumps}
                />
              </CardContainer>
            )}

            {/* Home Battery Information */}
            <InstallationHomeBattery installation={installation} />

            {/* Chill Devices */}
            <InstallationChillDevices installation={installation} />

            {/* Dongle Devices */}
            <InstallationDongleDevices installation={installation} />

            {/* Events */}
            <CardContainer title="Events">
              <InstallationEvents installationUuid={installationUuid} />
            </CardContainer>

            {/* Tickets (Hubspot) */}
            {installation.externalId && (
              <CardContainer title="Tickets (Hubspot)" defaultExpanded={false}>
                <InstallationTickets installationId={installation.externalId} />
              </CardContainer>
            )}

            {/* Tariffs */}
            {installation.externalId && (
              <InstallationTariffs installationId={installation.externalId} />
            )}

            {/* Snowflake Data */}
            <InstallationSnowflake installationUuid={installationUuid} />

            {/* Zuper Services */}
            {/* {installation.externalId && (
              <InstallationZuperService
                installationId={installation.externalId}
                isEnabled={isZuperEnabled}
                onToggle={setIsZuperEnabled}
              />
            )} */}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Desktop: Quick Actions */}
            {!isMobile && (
              <InstallationSidebarActions
                installation={installation}
                installationUuid={installationUuid}
                onRebootCIC={rebootCic}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                isRebootDisabled={isRebootDisabled}
                rebootLabel={rebootLabel}
                isLoading={isLoading}
              />
            )}

            {/* Notes */}
            {installation.externalId && (
              <InstallationNotes installationId={installation.externalId} />
            )}

            {/* Latest Non-Hybrid Commissioning */}
            {installation.externalId && (
              <InstallationCommissioning
                installationId={installation.externalId}
              />
            )}

            {/* Commissioning History */}
            <CardContainer
              title={`Commissioning History (${installation.cicCommissioning.length})`}
            >
              <InstallationSidebarCommissioning installation={installation} />
            </CardContainer>

            {/* CIC Settings & Config */}
            {installation.activeCic && (
              <>
                <CardContainer title="CIC Settings History">
                  <div className="max-h-[400px] space-y-4 overflow-y-auto">
                    <InstallationSettingsHistory installation={installation} />
                  </div>
                </CardContainer>
                <CardContainer title="CIC History">
                  <div className="max-h-[400px] overflow-y-auto">
                    <InstallationCicHistory installation={installation} />
                  </div>
                </CardContainer>
              </>
            )}

            {/* QR Codes */}
            <InstallationQRCodes installation={installation} />

            {/* Complete JSON Data */}
            <InstallationJsonCard installation={installation} />
          </div>
        </div>
      </motion.div>

      {/* Settings Modal */}
      <InstallationSettingsModal
        installation={installation}
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </div>
  );
}
