import React from "react";

import classes from "./InstallationDetail.module.css";
import {
  AdminInstallationDetail,
  CicSettingsUpdate,
  SettingsHeader,
} from "../api-client/models";
import { FormField, FormSection } from "../ui-components/form/Form";
import { Accordion, AccordionItem } from "../ui-components/accordion/Accordion";
import { formatDateTime } from "../utils/formatDate";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { useApiClient } from "../api-client/context";
import { useMutation } from "react-query";
import { AdminGetInstallationSettingRequest } from "../api-client/apis";

interface InstallationDetailProps {
  installationId: string;
  installation: AdminInstallationDetail;
}

export function InstallationDetailSettingsHistory({
  installationId,
  installation,
}: InstallationDetailProps) {
  const apiClient = useApiClient();

  const { mutateAsync, data, isLoading } = useMutation({
    mutationFn: ({
      installationId,
      settingsId,
    }: AdminGetInstallationSettingRequest) =>
      apiClient.adminGetInstallationSetting({
        installationId,
        settingsId,
      }),

    onError: (error) => {
      console.error("Error fetching settings details", error);
    },
  });

  const settingsData = data ? data.result : null;

  const getSettingsDetails = async (id: string) => {
    const settings = await mutateAsync({
      installationId: installationId,
      settingsId: id,
    });
    return settings.result;
  };

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="👀 Settings history" />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-commissioning"]}>
            <Accordion>
              {installation.settingsUpdates.map((setting, index) => (
                <InstallationDetailSettingsItem
                  key={index}
                  isLoading={isLoading}
                  data={settingsData}
                  createdAt={setting.createdAt}
                  updatedBy={setting.updatedBy}
                  isUnconfirmed={setting.isUnconfirmed}
                  onClick={() => getSettingsDetails(setting.settingsId)}
                />
              ))}
            </Accordion>
          </div>
          {installation.settingsUpdates.length === 0 && (
            <div style={{ textAlign: "center" }}>No settings updates 👍</div>
          )}
        </FormField>
      </FormSection>
    </div>
  );
}

interface InstallationDetailSettingsItemProps {
  isLoading: boolean;
  createdAt: Date;
  updatedBy: string | null;
  isUnconfirmed: boolean;
  onClick?: () => void;
  data: CicSettingsUpdate | null;
}

function InstallationDetailSettingsItem({
  isLoading,
  createdAt,
  updatedBy,
  isUnconfirmed,
  onClick,
  data,
}: InstallationDetailSettingsItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dataJson = data ?? [];
  const settings = data?.settings.toString();
  const settinsJson = settings ? JSON.parse(settings) : {};

  const excludedKeys = ["settings"];
  const datesKeys = ["createdAt", "updatedAt", "confirmedAt", "cancelledAt"];
  const listOfSettings = [
    ...Object.entries(dataJson)
      .filter(([key]) => !excludedKeys.includes(key))
      .map(([key, value]) => [
        key,
        datesKeys.includes(key) ? formatDateTime(value) : String(value),
      ]),
  ];

  const settingsColumn = [
    ...Object.entries(settinsJson).filter(([key]) => key !== "settingsId"),
  ];

  return (
    <AccordionItem
      title={formatDateTime(createdAt) || "No date"}
      additionalInfo={
        <>
          <div>Updated by: {updatedBy ?? "-"}</div>
          <div>Is Confirmed: {isUnconfirmed ? "❌" : "✅"}</div>
        </>
      }
      isOpen={isOpen}
      onChangeIsOpen={() => {
        setIsOpen(!isOpen);
        onClick?.();
      }}
    >
      {isLoading ? (
        <div>is Loading....</div>
      ) : (
        <div>
          <div className={classes["settings-history-card"]}>
            <ul className={classes["settings-history-bullet"]}>
              {listOfSettings.map(([key, value]) => (
                <li key={key}>
                  <>
                    <b>{key}:</b> {value}
                  </>
                </li>
              ))}
              <li>
                <b>settings:</b>
              </li>
              {settingsColumn.map(([key, value]) => (
                <li
                  className={classes["settings-history-child-setting"]}
                  key={key}
                >
                  <>
                    <b>{key}:</b> {value}
                  </>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AccordionItem>
  );
}
