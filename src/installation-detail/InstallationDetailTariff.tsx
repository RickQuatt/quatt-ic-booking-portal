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
import { roundNumber } from "../utils/number";
interface InstallationDetailTariffProps {
  installationId: string;
  tariff?: TarrifsResult | null;
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

  const createNewTariff = () => {
    setTariffData(null);
    openTariffsModal();
  };

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader
        title="💰 Tariffs"
        onClick={() => {
          createNewTariff();
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
            {tariff?.futureTariffs && tariff.futureTariffs.length !== 0 && (
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
            {tariff?.pastTariffs && tariff.pastTariffs.length !== 0 && (
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

            {tariff?.currentTariff === null && (
              <div style={{ textAlign: "center" }}>No tariffs set 😴</div>
            )}
          </div>
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
        style={{ cursor: "pointer" }}
        className={classes["detail-section"]}
        onClick={onClick}
        key={tariff.id}
      >
        <div className={classes["detail-section-bold"]}>
          {tariff.dayElectricityPrice && tariff.nightElectricityPrice ? (
            <div className={classes["tariff-grid"]}>
              <div>⚡️☀️ €{roundNumber(tariff.dayElectricityPrice, 2)}</div>
              <div>⚡️🌙 €{roundNumber(tariff.nightElectricityPrice, 2)}</div>
              <div>🔥 €{roundNumber(tariff.gasPrice, 2)}</div>
            </div>
          ) : (
            <div className={classes["tariff-grid"]}>
              <div>
                ⚡️ €
                {tariff.electricityPrice
                  ? roundNumber(tariff.electricityPrice, 2)
                  : "n/a"}
              </div>
              <div>🔥 €{roundNumber(tariff.gasPrice, 2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
