import React from "react";

import {
  AdminInstallationDetail,
  CicCommissioning,
} from "../api-client/models";
import {
  FormField,
  FormFieldJson,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./InstallationDetail.module.css";
import { Accordion, AccordionItem } from "../ui-components/accordion/Accordion";
import { formatDateTime } from "../utils/formatDate";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";

interface CICDetailProps {
  installation: AdminInstallationDetail;
}

export function InstallationDetailCommissioningHistory({
  installation,
}: CICDetailProps) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="👨‍🔧 Commissioning history" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Date of commissionings</FormFieldTitle>
          <div className={classes["detail-section-commissioning"]}>
            <Accordion>
              {installation.cicCommissioning
                .map((commissioning, index) => (
                  <InstallationDetailCommissioningItem
                    commissioning={commissioning}
                    key={index}
                  />
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

interface InstallationDetailCommissioningItemProps {
  commissioning: CicCommissioning;
}

function InstallationDetailCommissioningItem({
  commissioning,
}: InstallationDetailCommissioningItemProps) {
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
