import React from "react";

import {
  FormField,
  FormFieldTitle,
  FormSection,
} from "../ui-components/form/Form";
import { TariffsModal } from "./TariffsModal";
import classes from "./InstallationDetail.module.css";
import { Tariff } from "../api-client/models";
import { formatDateShortAsString } from "../utils/formatDate";
import { useModalState } from "../ui-components/modal/useModalState";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { roundNumber } from "../utils/number";
import { useGetInstallationTariffs } from "./hooks/useGetInstallationTariffs";
import { Loader } from "../ui-components/loader/Loader";
import { ResponseError } from "../api-client/runtime";
import ErrorText from "../ui-components/error-text/ErrorText";
interface InstallationDetailTariffProps {
  installationId: string;
}

export function InstallationDetailTariff({
  installationId,
}: InstallationDetailTariffProps) {
  const { tariffs, tariffsError, isLoadingTariffs, refetchTariffs } =
    useGetInstallationTariffs(installationId);

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

  if (isLoadingTariffs) {
    return <Loader />;
  }

  if (!tariffs || tariffsError) {
    const tariffsNotFound =
      tariffsError instanceof ResponseError &&
      tariffsError?.response?.status === 404;

    const errorDescription = tariffsNotFound
      ? `No tariffs found for installation: ${installationId}`
      : `Failed to fetch installation tariffs for installation: ${installationId}.`;

    const refetchInstallationTariffs = tariffsNotFound
      ? undefined
      : refetchTariffs;

    return (
      <ErrorText text={errorDescription} retry={refetchInstallationTariffs} />
    );
  }

  const { currentTariff, futureTariffs, pastTariffs } = tariffs;
  const hasFutureTariffs = futureTariffs && futureTariffs.length > 0;
  const hasPastTariffs = pastTariffs && pastTariffs.length > 0;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="💰 Tariffs" onClick={createNewTariff} />
      <TariffsModal
        isOpen={isTariffModalOpen}
        closeModal={closeTariffsModal}
        tariffData={tariffData}
        installationId={installationId}
        onSuccess={refetchTariffs}
        key={tariffData?.id || "new-tariff"}
      />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {currentTariff && (
              <>
                <FormFieldTitle>Current tariff</FormFieldTitle>
                <InstallationDetailTariffItem
                  tariff={currentTariff}
                  onClick={() => {
                    setTariffData(currentTariff);
                    openTariffsModal();
                  }}
                />
              </>
            )}

            {hasFutureTariffs && (
              <>
                <FormFieldTitle>Upcoming tariffs</FormFieldTitle>
                {futureTariffs.map((tariff, index) => (
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

            {hasPastTariffs && (
              <>
                <FormFieldTitle>Past tariffs</FormFieldTitle>
                {pastTariffs.map((tariff, index) => (
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

            {currentTariff === null && (
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
  const {
    dayElectricityPrice,
    nightElectricityPrice,
    electricityPrice,
    gasPrice,
    electricityTariffType,
    gasTariffType,
  } = tariff;

  const getElectricityDisplay = () => {
    if (electricityTariffType === "dynamic") {
      return "Dynamic";
    }
    return `€${electricityPrice ? roundNumber(electricityPrice, 2) : "n/a"}`;
  };

  const getGasDisplay = () => {
    if (gasTariffType === "dynamic") {
      return "Dynamic";
    }
    return `€${gasPrice ? roundNumber(gasPrice, 2) : "n/a"}`;
  };

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
          {dayElectricityPrice && nightElectricityPrice ? (
            <div className={classes["tariff-grid"]}>
              <div>⚡️☀️ €{roundNumber(dayElectricityPrice, 2)}</div>
              <div>⚡️🌙 €{roundNumber(nightElectricityPrice, 2)}</div>
              <div>🔥 {getGasDisplay()}</div>
            </div>
          ) : (
            <div className={classes["tariff-grid"]}>
              <div>⚡️ {getElectricityDisplay()}</div>
              <div>🔥 {getGasDisplay()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
