import React from "react";
import { useApiClient } from "../api-client/context";
import { AdminCic, UpdateCommissioningStatusEnum } from "../api-client/models";
import { Button, ButtonLink } from "../ui-components/button/Button";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import { useModalState } from "../ui-components/modal/useModalState";
import { AdvancedSettingsModal } from "./AdvancedSettingsModal";
import classes from "./CICDetail.module.css";
import { DetailSectionHeader } from "./CICDetailSectionHeader";
import {
  getGrafanaAllEDashboardLink,
  getGrafanaDataPerCICLink,
  getHubspotSearchOrderLink,
  getMenderLink,
} from "./getLinks";
import useRebootDevice from "../installation-detail/hooks/useRebootDevice";
import { AdminRebootDeviceRequestTargetEnum } from "../api-client/models/AdminRebootDeviceRequest";

export function CICDetailAdvanced({ cicData }: { cicData: AdminCic }) {
  const {
    isOpen: isAdvancedSettingsModalOpen,
    open: openAdvancedSettingsModal,
    close: closeAdvancedSettingsModal,
  } = useModalState();
  const rebootCic = useRebootDevice(
    cicData.id,
    AdminRebootDeviceRequestTargetEnum.Cic,
  );
  const rebootHeatCharger = useRebootDevice(
    cicData.id,
    AdminRebootDeviceRequestTargetEnum.HeatCharger,
  );
  const apiClient = useApiClient();

  const isAllE = cicData.allEStatus !== null;
  const installationId = cicData.installationId;

  const resetWifiNetwork = React.useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you would like to forget the current WiFi network?",
      )
    ) {
      return;
    }

    await apiClient.adminForgetWifi({
      cicId: cicData.id,
      forgetWifiMeCicRequest: { ssid: cicData.wifiSSID as string },
    });
  }, [apiClient, cicData.id, cicData.wifiSSID]);

  const cancelHybridCommissioning = React.useCallback(async () => {
    if (installationId === null) {
      alert("No installation ID found.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you would like to cancel the commissioning process?",
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.adminCancelCommissioning({
        cicId: cicData.id,
      });

      if (response.meta.status === 200) {
        alert("Commissioning process cancelled successfully.");
      }
    } catch (error) {
      alert("No commissioning is ongoing.");
    }
  }, [apiClient, cicData.id, installationId]);

  const cancelAllECommissioning = React.useCallback(async () => {
    if (installationId === null) {
      alert("No installation ID found.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you would like to cancel the commissioning process?",
      )
    ) {
      return;
    }

    try {
      await apiClient.updateInstallationCommissioning({
        installationId: installationId,
        updateCommissioning: {
          status: UpdateCommissioningStatusEnum.Cancelled,
          forced: true,
        },
      });

      alert("Commissioning process cancelled successfully.");
    } catch (error) {
      alert("No commissioning is ongoing.");
    }
  }, [apiClient, installationId]);

  const completeCommissioning = React.useCallback(async () => {
    if (installationId === null) {
      alert("No installation ID found.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you would like to complete the commissioning process?",
      )
    ) {
      return;
    }

    try {
      if (!isAllE) {
        // This is for non all electric installations
        const response = await apiClient.adminCompleteCommissioning({
          cicId: cicData.id,
        });

        if (response.meta.status === 200) {
          alert("Commissioning process completed successfully.");
        }
      } else {
        await apiClient.updateInstallationCommissioning({
          installationId: installationId,
          updateCommissioning: {
            status: UpdateCommissioningStatusEnum.Success,
            forced: true,
          },
        });
      }

      alert("Commissioning process completed successfully.");
    } catch (error) {
      alert("No commissioning is ongoing.");
    }
  }, [apiClient, installationId, isAllE, cicData.id]);

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Advanced details" />
      <AdvancedSettingsModal
        isOpen={isAdvancedSettingsModalOpen}
        closeModal={closeAdvancedSettingsModal}
        cicId={cicData.id}
        cicData={cicData}
      />
      <FormSection>
        <ButtonLink
          href={
            cicData.orderNumber
              ? getHubspotSearchOrderLink(cicData.orderNumber)
              : undefined
          }
          target="_blank"
          disabled={!cicData.orderNumber}
        >
          Hubspot Search Order
        </ButtonLink>
        {cicData.menderId && (
          <ButtonLink href={getMenderLink(cicData.menderId)} target="_blank">
            Mender
          </ButtonLink>
        )}
        <ButtonLink href={getGrafanaDataPerCICLink(cicData.id)} target="_blank">
          Grafana
        </ButtonLink>
        <ButtonLink
          href={
            cicData.allEStatus
              ? getGrafanaAllEDashboardLink(cicData.id)
              : undefined
          }
          target="_blank"
          disabled={!cicData.allEStatus}
        >
          Grafana - All E Dashboard
        </ButtonLink>
        <FormField>
          <FormFieldTitle>Supervisory Control Mode</FormFieldTitle>
          <FormFieldValue value={cicData.supervisoryControlMode} />
        </FormField>
        <Button color="danger" onClick={openAdvancedSettingsModal}>
          Advanced settings
        </Button>
        {cicData.supportsForgetWifi && (
          <Button onClick={resetWifiNetwork}>Forget WiFi network</Button>
        )}
        {cicData.supportsRebootAndForget && (
          <Button onClick={rebootCic}>Reboot CIC</Button>
        )}
        {isAllE && (
          <Button onClick={rebootHeatCharger}>Reboot HeatCharger</Button>
        )}
        {cicData.supportsForceAndCancelCommissioning && (
          <Button onClick={cancelHybridCommissioning}>
            Cancel Hybrid commissioning
          </Button>
        )}
        {cicData.supportsForceAndCancelCommissioning && (
          <Button onClick={cancelAllECommissioning}>
            Cancel All-E commissioning
          </Button>
        )}
        {cicData.supportsForceAndCancelCommissioning && (
          <Button onClick={completeCommissioning}>Force commissioning</Button>
        )}
      </FormSection>
    </div>
  );
}
