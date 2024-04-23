import React, { useEffect } from "react";

import * as yup from "yup";
import {
  FormField,
  FormFieldInput,
  FormFieldTitle,
  FormSection,
  FormSelectInput,
} from "../ui-components/form/Form";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalProps,
  ModalActions,
  ModalConfirmButton,
  ModalDeleteButton,
} from "../ui-components/modal/Modal";
import { Tariff } from "../api-client/models";
import { useApiClient } from "../api-client/context";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Props extends ModalProps {
  installationId: string;
  tariffData: Tariff | null;
}

const TariffFormSchema = yup.object({
  tariffType: yup.string().required(),
  electricityPrice: yup.number().nullable(),
  dayElectricityPrice: yup.number().nullable(),
  nightElectricityPrice: yup.number().nullable(),
  gasPrice: yup.number().nullable(),
  validFrom: yup.date().required(),
});

type TariffFormData = yup.InferType<typeof TariffFormSchema>;

export function TariffsModal({
  isOpen,
  closeModal,
  tariffData,
  installationId,
}: Props) {
  const selectedTariff =
    tariffData?.dayElectricityPrice && tariffData?.nightElectricityPrice
      ? "double"
      : "single";
  const [tariffType, setTariffType] = React.useState<string>(selectedTariff);
  const [startDate, setStartDate] = React.useState(tariffData?.validFrom);

  const defaultValues = React.useMemo(() => {
    return {
      tariffType: selectedTariff,
      electricityPrice: tariffData?.electricityPrice,
      dayElectricityPrice: tariffData?.dayElectricityPrice,
      nightElectricityPrice: tariffData?.nightElectricityPrice,
      gasPrice: tariffData?.gasPrice,
      validFrom: tariffData?.validFrom,
    };
  }, [tariffData, selectedTariff]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
    control,
  } = useForm<TariffFormData>({
    resolver: yupResolver(TariffFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);

    if (tariffData) {
      setTariffType(selectedTariff);
      setStartDate(tariffData.validFrom);
    }

    return () => {
      reset();
    };
  }, [reset, defaultValues, selectedTariff, tariffData]);

  const apiClient = useApiClient();
  const onSubmit = React.useCallback(
    async (data: TariffFormData) => {
      if (
        !window.confirm("Are you sure you would like to update the tariffs?")
      ) {
        return;
      }

      // If there is no tariff data, create a new tariff
      if (!tariffData) {
        if (tariffType === "single") {
          const response = await apiClient.adminCreateInstallationTariff({
            installationId: installationId,
            createTariffRequest: {
              tariffType: "single",
              electricityPrice: data.electricityPrice as number,
              gasPrice: data.gasPrice as number,
              validFrom: new Date(
                new Date(data.validFrom).getTime() + 2 * 60 * 60 * 1000,
              ),
            },
          });
          if (response.meta.status >= 200) {
            reset({}, { keepValues: true });
            closeModal();
          }
        } else {
          const response = await apiClient.adminCreateInstallationTariff({
            installationId: installationId,
            createTariffRequest: {
              tariffType: "double",
              dayElectricityPrice: data.dayElectricityPrice as number,
              nightElectricityPrice: data.nightElectricityPrice as number,
              gasPrice: data.gasPrice as number,
              validFrom: new Date(
                new Date(data.validFrom).getTime() + 2 * 60 * 60 * 1000,
              ),
            },
          });
          if (response.meta.status >= 200) {
            reset({}, { keepValues: true });
            closeModal();
          }
        }
      }

      if (!tariffData?.id) {
        return;
      }

      if (tariffType === "single") {
        const response = await apiClient.adminUpdateInstallationTariff({
          installationId: installationId,
          tariffId: tariffData.id,
          createTariffRequest: {
            tariffType: "single",
            electricityPrice: data.electricityPrice as number,
            gasPrice: data.gasPrice as number,
            validFrom: new Date(
              new Date(data.validFrom).getTime() + 2 * 60 * 60 * 1000,
            ),
          },
        });
        if (response.meta.status === 200) {
          reset({}, { keepValues: true });
          closeModal();
        }
      } else {
        const response = await apiClient.adminUpdateInstallationTariff({
          installationId: installationId,
          tariffId: tariffData.id,
          createTariffRequest: {
            tariffType: "double",
            dayElectricityPrice: data.dayElectricityPrice as number,
            nightElectricityPrice: data.nightElectricityPrice as number,
            gasPrice: data.gasPrice as number,
            validFrom: new Date(
              new Date(data.validFrom).getTime() + 2 * 60 * 60 * 1000,
            ),
          },
        });
        if (response.meta.status === 200) {
          reset({}, { keepValues: true });
          closeModal();
        }
      }
    },

    [apiClient, closeModal, reset, tariffData, installationId, tariffType],
  );

  const onDelete = React.useCallback(async () => {
    if (
      !window.confirm("Are you sure you would like to delete the tariff data?")
    ) {
      return;
    }

    if (!tariffData?.id) {
      return;
    }

    await apiClient.adminDeleteInstallationTariff({
      installationId: installationId,
      tariffId: tariffData.id,
    });

    reset({}, { keepValues: true });
    closeModal();
  }, [apiClient, closeModal, reset, installationId, tariffData]);

  return (
    <Modal isOpen={isOpen} closeModal={closeModal}>
      <ModalHeader>Edit tariff data</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalContent>
          <FormSection>
            <FormField>
              <FormFieldTitle>Tariff</FormFieldTitle>
              <FormSelectInput
                defaultValue={tariffType}
                {...register("tariffType", {
                  setValueAs: (value) => value,
                  onChange: (e) => setTariffType(e.target.value),
                })}
              >
                <option value="single">Single tariff</option>
                <option value="double">Double tariff</option>
              </FormSelectInput>
            </FormField>
            {tariffType === "single" ? (
              <>
                <FormField>
                  <FormFieldTitle>⚡️ Electricity tariff</FormFieldTitle>
                  <FormFieldInput
                    type="number"
                    step="0.00001"
                    error={errors.electricityPrice}
                    {...register("electricityPrice")}
                  />
                </FormField>
              </>
            ) : (
              <>
                <FormField>
                  <FormFieldTitle>⚡️☀️ Day electricity tariff</FormFieldTitle>
                  <FormFieldInput
                    type="number"
                    step="0.00001"
                    error={errors.dayElectricityPrice}
                    {...register("dayElectricityPrice")}
                  />
                </FormField>
                <FormField>
                  <FormFieldTitle>
                    ⚡️🌙 Night electricity tariff
                  </FormFieldTitle>
                  <FormFieldInput
                    type="number"
                    step="0.00001"
                    error={errors.nightElectricityPrice}
                    {...register("nightElectricityPrice")}
                  />
                </FormField>
              </>
            )}
            <FormField>
              <FormFieldTitle>🔥 Gas tariff</FormFieldTitle>
              <FormFieldInput
                type="number"
                step="0.00001"
                error={errors.gasPrice}
                {...register("gasPrice")}
              />
            </FormField>
            <FormField>
              <FormFieldTitle>📆 Valid from</FormFieldTitle>
              <Controller
                control={control}
                name="validFrom"
                // defaultValue={tariffData?.validFrom}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value || startDate}
                    onSelect={(date) => {
                      field.onChange(date);
                      setStartDate(date);
                    }}
                    onChange={(date) => {
                      date && field.onChange(date);
                      date && setStartDate(date);
                    }}
                    dateFormat="dd MMM yyyy"
                    wrapperClassName="date-picker"
                  />
                )}
              />
            </FormField>
          </FormSection>
        </ModalContent>
        <ModalActions>
          {tariffData && (
            <ModalDeleteButton color="danger" onClick={onDelete}>
              Delete
            </ModalDeleteButton>
          )}
          <ModalConfirmButton type="submit" disabled={!isDirty || isSubmitting}>
            Submit
          </ModalConfirmButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
