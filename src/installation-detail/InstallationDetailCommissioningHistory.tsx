import React from "react";

import { AdminInstallationDetail } from "../api-client/models";
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
import { useApiClient } from "../api-client/context";
import { useQuery } from "@tanstack/react-query";
import ErrorText from "../ui-components/error-text/ErrorText";

interface InstallationDetailCommissioningHistoryProps {
  installation: AdminInstallationDetail;
}

export function InstallationDetailCommissioningHistory({
  installation,
}: InstallationDetailCommissioningHistoryProps) {
  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="👨‍🔧 Commissioning history" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Date of commissionings</FormFieldTitle>
          <div className={classes["detail-section-commissioning"]}>
            <Accordion>
              {installation.cicCommissioning.map((commissioning, index) => (
                <InstallationDetailCommissioningItem
                  key={index}
                  externalId={installation.externalId}
                  commissioningId={commissioning.id}
                  createdAt={commissioning.createdAt}
                  isForced={commissioning.isForced}
                />
              ))}
            </Accordion>
          </div>
        </FormField>
      </FormSection>
    </div>
  );
}

interface InstallationDetailCommissioningItemProps {
  createdAt: Date;
  isForced: boolean;
  externalId: string | null;
  commissioningId: number;
}

function InstallationDetailCommissioningItem({
  isForced,
  createdAt,
  externalId,
  commissioningId,
}: InstallationDetailCommissioningItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const apiClient = useApiClient();
  const installationId = externalId || "";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["installationCommissioning", installationId, commissioningId],
    queryFn: () =>
      apiClient.adminGetInstallationCommissioning({
        installationId,
        commissioningId,
      }),
    enabled: isOpen && !!installationId && !!commissioningId,
  });

  const commissioningData = data?.result;

  const toggleOpen = () => {
    setIsOpen((prevValue) => !prevValue);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AccordionItem
      title={
        `${formatDateTime(createdAt)} ${
          isForced ? `- (Forced ${isForced && "⛔️"})` : ""
        }` || "No date"
      }
      isOpen={isOpen}
      onChangeIsOpen={toggleOpen}
    >
      {isError ? (
        <ErrorText
          text={`Failed to fetch commisioning with id ${commissioningId}.`}
          retry={refetch}
        />
      ) : (
        data && <FormFieldJson value={commissioningData} />
      )}
    </AccordionItem>
  );
}
