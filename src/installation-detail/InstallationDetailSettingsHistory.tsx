import React from "react";

import classNames from "classnames";
import classes from "./InstallationDetail.module.css";
import { AdminInstallationDetail } from "../api-client/models";
import { FormField, FormSection } from "../ui-components/form/Form";
import { Accordion, AccordionItem } from "../ui-components/accordion/Accordion";
import { formatDateTime } from "../utils/formatDate";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { useApiClient } from "../api-client/context";
import { useQuery } from "@tanstack/react-query";
import ErrorText from "../ui-components/error-text/ErrorText";

interface InstallationDetailProps {
  installation: AdminInstallationDetail;
}

const renderNestedValue = (value: unknown, indent = 1) => {
  if (value === null || value === undefined) {
    return <span>null</span>;
  }

  if (Array.isArray(value)) {
    return (
      <ul
        style={{
          paddingLeft: `${indent * 20}px`,
          marginTop: 0,
          marginBottom: 0,
        }}
      >
        {value.map((item, index) => (
          <li key={index}>
            {typeof item === "object" && item !== null
              ? renderNestedValue(item, indent + 1)
              : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <ul
        style={{
          paddingLeft: `${indent * 20}px`,
          marginTop: 0,
          marginBottom: 0,
        }}
      >
        {Object.entries(value).map(([nestedKey, nestedValue]) => (
          <li key={nestedKey}>
            <b>{nestedKey}:</b>{" "}
            {typeof nestedValue === "object" && nestedValue !== null
              ? renderNestedValue(nestedValue, indent + 1)
              : String(nestedValue)}
          </li>
        ))}
      </ul>
    );
  }

  return String(value);
};

export function InstallationDetailSettingsHistory({
  installation,
}: InstallationDetailProps) {
  const { settingsUpdates } = installation;
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="👀 Settings history" />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-commissioning"]}>
            <Accordion>
              {settingsUpdates.map((setting, index) => (
                <InstallationDetailSettingsItem
                  key={index}
                  installationId={installation.externalId}
                  settingsId={setting.settingsId}
                  createdAt={setting.createdAt}
                  updatedBy={setting.updatedBy}
                  isUnconfirmed={setting.isUnconfirmed}
                />
              ))}
            </Accordion>
          </div>
          {settingsUpdates.length === 0 && (
            <div style={{ textAlign: "center" }}>No settings updates 👍</div>
          )}
        </FormField>
      </FormSection>
    </div>
  );
}

interface InstallationDetailSettingsItemProps {
  createdAt: Date;
  updatedBy: string | null;
  isUnconfirmed: boolean;
  installationId: string | null;
  settingsId: string | null;
}

function InstallationDetailSettingsItem({
  createdAt,
  updatedBy,
  isUnconfirmed,
  installationId,
  settingsId,
}: InstallationDetailSettingsItemProps) {
  const apiClient = useApiClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["installationSettings", installationId, settingsId],
    queryFn: () =>
      apiClient.adminGetInstallationSetting({
        installationId: installationId || "",
        settingsId: settingsId || "",
      }),
    enabled: isOpen && !!installationId && !!settingsId,
  });

  const dataJson = data?.result ?? [];
  const settingsString = data?.result?.settings.toString();
  const settings = JSON.parse(settingsString || "{}");

  const excludedKeys = ["settings"];
  const datesKeys = ["createdAt", "updatedAt", "confirmedAt", "cancelledAt"];
  const listOfSettings = Object.entries(dataJson)
    .filter(([key]) => !excludedKeys.includes(key))
    .map(([key, value]) => [
      key,
      datesKeys.includes(key) ? formatDateTime(value) : String(value),
    ]);

  const settingsColumn = Object.entries(settings).filter(
    ([key]) => key !== "settingsId",
  );

  const toggleOpen = () => {
    setIsOpen((prevValue) => !prevValue);
  };

  if (isError) {
    return (
      <ErrorText
        text={`Failed to fetch settings update with settings id ${settingsId}.`}
        retry={refetch}
      />
    );
  }

  return (
    <AccordionItem
      title={formatDateTime(createdAt) || "No date"}
      additionalInfo={
        <>
          <span>Updated by: {updatedBy ?? "System"}</span>
          <div>Is Confirmed: {isUnconfirmed ? "❌" : "✅"}</div>
        </>
      }
      isOpen={isOpen}
      onChangeIsOpen={toggleOpen}
    >
      {isPending ? (
        <span>is Loading....</span>
      ) : (
        <ul
          className={classNames(
            classes["settings-history-card"],
            classes["settings-history-bullet"],
          )}
        >
          {listOfSettings.map(([key, value]) => (
            <li key={key}>
              <b>{key}:</b> {value}
            </li>
          ))}
          <li>
            <b>settings:</b>
          </li>
          {settingsColumn.map(([key, value]) => {
            try {
              if (typeof value === "object") {
                return (
                  <li
                    className={classes["settings-history-child-setting"]}
                    key={key}
                  >
                    <b>{key}:</b> {renderNestedValue(value)}
                  </li>
                );
              }
              return (
                <li
                  className={classes["settings-history-child-setting"]}
                  key={key}
                >
                  <>
                    <b>{key}:</b> {value}
                  </>
                </li>
              );
            } catch (e) {
              console.error(
                "The following Settings Update Message field could not be render",
                e,
                { key, value },
              );
              return (
                <li>The Property {key} cound not be rendered correctly</li>
              );
            }
          })}
        </ul>
      )}
    </AccordionItem>
  );
}
