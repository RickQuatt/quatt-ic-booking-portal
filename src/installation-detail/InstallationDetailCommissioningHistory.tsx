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
import { useApiClient } from "../api-client/context";
import { useMutation } from "react-query";
import { AdminGetInstallationCommissioningRequest } from "../api-client/apis";

interface InstallationDetailCommissioningHistoryProps {
  installationId: string;
  installation: AdminInstallationDetail;
}

export function InstallationDetailCommissioningHistory({
  installationId,
  installation,
}: InstallationDetailCommissioningHistoryProps) {
  const apiClient = useApiClient();

  const { mutateAsync, data, isLoading } = useMutation({
    mutationFn: ({
      installationId,
      commissioningId,
    }: AdminGetInstallationCommissioningRequest) =>
      apiClient.adminGetInstallationCommissioning({
        installationId,
        commissioningId,
      }),

    onError: (error) => {
      console.error("Error fetching commissioning details", error);
    },
  });

  const commissioningData = data ? data.result : null;

  const getCommissioningDetails = async (id: number) => {
    const commmissioning = await mutateAsync({
      installationId: installationId,
      commissioningId: id,
    });
    return commmissioning.result;
  };

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
                  isLoading={isLoading}
                  data={commissioningData}
                  createdAt={commissioning.createdAt}
                  isForced={commissioning.isForced}
                  onClick={() => getCommissioningDetails(commissioning.id)}
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
  isLoading: boolean;
  onClick?: () => void;
  data: CicCommissioning | null;
}

function InstallationDetailCommissioningItem({
  data,
  onClick,
  isForced,
  isLoading,
  createdAt,
}: InstallationDetailCommissioningItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <AccordionItem
      title={
        `${formatDateTime(createdAt)} - (Forced ${isForced && "⛔️"})` ||
        "No date"
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
        data && <FormFieldJson value={data} />
      )}
    </AccordionItem>
  );
}
