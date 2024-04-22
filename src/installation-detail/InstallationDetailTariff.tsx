import React from "react";

import {
  FormField,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import { TariffsModal } from "./TariffsModal";
import classes from "./InstallationDetail.module.css";
import { Tariff, TarrifsResult } from "../api-client/models";
import { formatDateShortAsString } from "../utils/formatDate";
import { useModalState } from "../ui-components/modal/useModalState";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";

interface InstallationDetailTariffProps {
  installationId: string;
  tariff: TarrifsResult | null;
}

export function InstallationDetailTariff({
  installationId,
  tariff,
}: InstallationDetailTariffProps) {
  const [tariffData, setTariffData] = React.useState<Tariff | null>(null);
  const {
    isOpen: isTariffModalOpen,
    open: openTariffsModal,
    close: closeTariffsModal,
  } = useModalState();

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader
        title="💰 Tariffs"
        onClick={() => {
          setTariffData(null); // Set to null to create a new tariff
          openTariffsModal();
        }}
      />
      <TariffsModal
        isOpen={isTariffModalOpen}
        closeModal={closeTariffsModal}
        tariffData={tariffData}
        installationId={installationId}
      />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {/* Current Tariffs */}
            {tariff?.currentTariff && (
              <>
                <FormFieldTitle>Current tariff</FormFieldTitle>
                <InstallationDetailTariffItem
                  tariff={tariff.currentTariff}
                  onClick={() => {
                    setTariffData(tariff.currentTariff);
                    openTariffsModal();
                  }}
                />
              </>
            )}

            {/* Future Tariffs */}
            {tariff?.futureTariffs && (
              <>
                <FormFieldTitle>Upcoming tariffs</FormFieldTitle>
                {tariff.futureTariffs.map((tariff, index) => (
                  <div key={index}>
                    <InstallationDetailTariffItem
                      tariff={tariff}
                      onClick={() => {
                        setTariffData(tariff);
                        openTariffsModal();
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {/* Past Tariffs */}
            {tariff?.pastTariffs && (
              <>
                <FormFieldTitle>Past tariffs</FormFieldTitle>
                {tariff.pastTariffs.map((tariff, index) => (
                  <div key={index}>
                    <InstallationDetailTariffItem
                      tariff={tariff}
                      onClick={() => {
                        setTariffData(tariff);
                        openTariffsModal();
                      }}
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          {tariff && tariff.currentTariff === null && (
            <div style={{ textAlign: "center" }}>No tariffs set 😴</div>
          )}
        </FormField>
      </FormSection>
    </div>
  );
}

function InstallationDetailTariffItem({
  tariff,
  onClick,
}: {
  tariff: Tariff;
  onClick: () => void;
}) {
  return (
    <div>
      <div className={classes["tariff-header"]}>
        From: {formatDateShortAsString(tariff.validFrom)}
      </div>
      <div
        className={classes["detail-section"]}
        onClick={onClick}
        key={tariff.id}
      >
        <div className={classes["detail-section-bold"]}>
          {tariff.dayElectricityPrice && tariff.nightElectricityPrice ? (
            <div className={classes["tariff-grid"]}>
              <div>⚡️☀️ €{tariff.dayElectricityPrice}</div>
              <div>⚡️🌙 €{tariff.nightElectricityPrice}</div>
              <div>🔥 €{tariff.gasPrice}</div>
            </div>
          ) : (
            <div className={classes["tariff-grid"]}>
              <div>⚡️ €{tariff.electricityPrice}</div>
              <div>🔥 €{tariff.gasPrice}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
