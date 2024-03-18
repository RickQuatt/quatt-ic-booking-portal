import React from "react";
import { AdminCic, CicAvailableWifiNetworksInner } from "../api-client/models";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import { formatDateDistance } from "../utils/formatDate";
import classes from "./CICDetail.module.css";
import { DetailSectionHeader } from "./CICDetailSectionHeader";
import { Accordion, AccordionItem } from "../ui-components/accordion/Accordion";

export function CICDetailNetworkConnection({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Network connection" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Last connection status updated at</FormFieldTitle>
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
        <FormField>
          <FormFieldTitle>Last scanned for Wifi</FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(cicData.lastScannedForWifi)}
          />
        </FormField>

        {cicData.availableWifiNetworks && (
          <Accordion>
            {cicData.availableWifiNetworks.map((data, index) => (
              <AvailableWifiNetwork key={index} data={data} index={index + 1} />
            ))}
          </Accordion>
        )}
      </FormSection>
    </div>
  );
}

function AvailableWifiNetwork({
  index,
  data,
}: {
  index: number;
  data: CicAvailableWifiNetworksInner;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <AccordionItem
      title={`Available network ${index}: ${data.SSID}`}
      isOpen={isOpen}
      onChangeIsOpen={() => setIsOpen(!isOpen)}
    >
      <FormSection>
        <FormField>
          <FormFieldTitle>Status</FormFieldTitle>
          <FormFieldValue value={data.SSID} />
        </FormField>
        <FormField>
          <FormFieldTitle>Signal</FormFieldTitle>
          <FormFieldValue value={data.signal} />
        </FormField>
        <FormField>
          <FormFieldTitle>Security</FormFieldTitle>
          <FormFieldValue value={data.security} />
        </FormField>
        <FormField>
          <FormFieldTitle>Encrypted</FormFieldTitle>
          <FormFieldValue value={data.encrypted} />
        </FormField>
        <FormField>
          <FormFieldTitle>Bars out of 5</FormFieldTitle>
          <FormFieldValue value={data.barsOutOf5} />
        </FormField>
      </FormSection>
    </AccordionItem>
  );
}
