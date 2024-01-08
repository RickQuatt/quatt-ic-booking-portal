import React from "react";
import classes from "./CICDetail.module.css";
import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldJson,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";
import { Accordion, AccordionItem } from "../ui-components/accordion/Accordion";
import { formatDateTime } from "../utils/formatDate";

interface CICDetailCommissioningProps {
  cicData: AdminCic;
}

export function CICDetailCommissioning({
  cicData,
}: CICDetailCommissioningProps) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Commissioning  details" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Date of commissionings</FormFieldTitle>
          <Accordion>
            {cicData.commissioningHistory.map((commissioning) => (
              <CICDetailCommissioningItem commissioning={commissioning} />
            ))}
          </Accordion>
        </FormField>
      </FormSection>
    </div>
  );
}

function CICDetailCommissioningItem({
  commissioning,
}: {
  commissioning: AdminCic["commissioningHistory"][0];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <AccordionItem
      title={formatDateTime(commissioning.createdAt) || "No date"}
      isOpen={isOpen}
      onChangeIsOpen={() => setIsOpen(!isOpen)}
    >
      <FormFieldJson value={commissioning} />
    </AccordionItem>
  );
}
