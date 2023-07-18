import { AdminCic } from "../api-client/models";
import { FormField, FormFieldTitle, FormFieldValue, FormSection } from "../ui-components/form/Form";
import { formatDateDistance } from "../utils/formatDate";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailNetworkConnection({
  cicData
}: {
  cicData: AdminCic
}) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Network connection" />
      <FormSection>
        <FormField>
          <FormFieldTitle>
            Last connection status updated at
          </FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(cicData.lastConnectionStatusUpdatedAt)}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Ethernet cable connection status</FormFieldTitle>
          <FormFieldValue value={cicData.cableConnectionStatus} />
        </FormField>
        <FormField>
          <FormFieldTitle>LTE connection status</FormFieldTitle>
          <FormFieldValue value={cicData.lteConnectionStatus} />
        </FormField>
        <FormField>
          <FormFieldTitle>Wifi enabled</FormFieldTitle>
          <FormFieldValue value={cicData.wifiEnabled} />
        </FormField>
        <FormField>
          <FormFieldTitle>Wifi connection status</FormFieldTitle>
          <FormFieldValue value={cicData.wifiConnectionStatus} />
        </FormField>
        <FormField>
          <FormFieldTitle>Wifi SSID</FormFieldTitle>
          <FormFieldValue value={cicData.wifiSSID} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is scanning for Wifi</FormFieldTitle>
          <FormFieldValue value={cicData.isScanningForWifi} />
        </FormField>
      </FormSection>
    </div>
  )
}