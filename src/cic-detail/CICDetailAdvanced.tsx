import React from "react";
import { useApiClient } from "../api-client/context";
import { AdminCic } from "../api-client/models";
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
  getGrafanaDataPerCICLink,
  getHubspotSearchOrderLink,
  getMenderLink,
} from "./getLinks";

export function CICDetailAdvanced({ cicData }: { cicData: AdminCic }) {
  const {
    isOpen: isAdvancedSettingsModalOpen,
    open: openAdvancedSettingsModal,
    close: closeAdvancedSettingsModal,
  } = useModalState();

  const apiClient = useApiClient();

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

  const rebootCic = React.useCallback(async () => {
    if (!window.confirm("Are you sure you would like to reboot the CIC?")) {
      return;
    }

    const response = await apiClient.adminRebootCIC({ cicId: cicData.id });

    if (response.meta.status === 200) {
      alert("Reboot request sent successfully.");
    } else {
      alert("Failed to send reboot request.");
    }
  }, [apiClient, cicData.id]);

  const cancelCommissioning = React.useCallback(async () => {
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
  }, [apiClient, cicData.id]);

  const completeCommissioning = React.useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you would like to complete the commissioning process?",
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.adminCompleteCommissioning({
        cicId: cicData.id,
      });

      if (response.meta.status === 200) {
        alert("Commissioning process completed successfully.");
      }
    } catch (error) {
      alert("No commissioning is ongoing.");
    }
  }, [apiClient, cicData.id]);

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
        {cicData.supportsForceAndCancelCommissioning && (
          <Button onClick={cancelCommissioning}>Cancel commissioning</Button>
        )}
        {cicData.supportsForceAndCancelCommissioning && (
          <Button onClick={completeCommissioning}>Force commissioning</Button>
        )}
      </FormSection>
    </div>
  );
}
