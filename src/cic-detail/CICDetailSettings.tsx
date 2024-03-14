import React from "react";

import classes from "./CICDetail.module.css";
import { AdminCic, CicSettingsUpdate } from "../api-client/models";
import {
  FormField,
  FormFieldJson,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";
import { Accordion, AccordionItem } from "../ui-components/accordion/Accordion";
import { formatDateTime } from "../utils/formatDate";

interface CICDetailProps {
  cicData: AdminCic;
}

export function CICDetailSettings({ cicData }: CICDetailProps) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Settings history" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Date of updated setting</FormFieldTitle>
          <div className={classes["detail-section-commissioning"]}>
            <Accordion>
              {cicData.settingsUpdates.map((setting) => (
                <CICDetailSettingsItem settingsUpdate={setting} />
              ))}
            </Accordion>
          </div>
        </FormField>
      </FormSection>
    </div>
  );
}

interface CICDetailCommissioningItemProps {
  settingsUpdate: CicSettingsUpdate;
}

function CICDetailSettingsItem({
  settingsUpdate,
}: CICDetailCommissioningItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <AccordionItem
      title={formatDateTime(settingsUpdate.createdAt) || "No date"}
      additionalInfo={
        <>
          <div>Updated by: {settingsUpdate.updatedBy ?? "-"}</div>
          <div>Is Confirmed: {settingsUpdate.isUnconfirmed ? "❌" : "✅"}</div>
        </>
      }
      isOpen={isOpen}
      onChangeIsOpen={() => setIsOpen(!isOpen)}
    >
      <FormFieldJson value={settingsUpdate} />
    </AccordionItem>
  );
}
