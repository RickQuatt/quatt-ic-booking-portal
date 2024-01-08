import React from "react";

import classes from "./CICDetail.module.css";
import { AdminCic, CicCommissioning } from "../api-client/models";
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

export function CICDetailCommissioning({ cicData }: CICDetailProps) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Commissioning details" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Date of commissionings</FormFieldTitle>
          <div className={classes["detail-section-commissioning"]}>
            <Accordion>
              {cicData.commissioningHistory
                .map((commissioning) => (
                  <CICDetailCommissioningItem commissioning={commissioning} />
                ))
                .sort((a, b) => {
                  if (
                    a.props.commissioning.createdAt >
                    b.props.commissioning.createdAt
                  ) {
                    return -1;
                  }
                  if (
                    a.props.commissioning.createdAt <
                    b.props.commissioning.createdAt
                  ) {
                    return 1;
                  }
                  return 0;
                })}
            </Accordion>
          </div>
        </FormField>
      </FormSection>
    </div>
  );
}

interface CICDetailCommissioningItemProps {
  commissioning: CicCommissioning;
}

function CICDetailCommissioningItem({
  commissioning,
}: CICDetailCommissioningItemProps) {
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
