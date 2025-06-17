import { useEffect, useCallback, useMemo } from "react";

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
import {
  CreateUpdateDoubleTariff,
  CreateUpdateSingleTariff,
  Tariff,
} from "../api-client/models";
import { useApiClient } from "../api-client/context";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatAsDate } from "../utils/formatDate";
import { ResponseError } from "../api-client/runtime";
import { ErrorResponse } from "../api-client/models/ErrorResponse";

interface Props extends ModalProps {
  installationId: string;
  tariffData: Tariff | null;
  onSuccess: () => void;
}

const TariffFormSchema = yup.object({
  tariffType: yup.string().required(),
  electricityPrice: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .when("tariffType", {
      is: "single",
      then: (schema) => schema.required("Electricity tariff is required"),
      otherwise: (schema) => schema.nullable(),
    }),

  dayElectricityPrice: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .when("tariffType", {
      is: "double",
      then: (schema) => schema.required("Day electricity tariff is required"),
      otherwise: (schema) => schema.nullable(),
    }),

  nightElectricityPrice: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .when("tariffType", {
      is: "double",
      then: (schema) => schema.required("Night electricity tariff is required"),
      otherwise: (schema) => schema.nullable(),
    }),

  gasPrice: yup
    .number()
    .required("Gas price is required")
    .transform((value, originalValue) => (originalValue === "" ? null : value)),
  validFrom: yup.date().required(),
});

type TariffFormData = yup.InferType<typeof TariffFormSchema>;

const handleRequestFailure = async (error: unknown, message: string) => {
  if (error instanceof ResponseError) {
    const errorData: ErrorResponse = await error.response.json();
    alert(
      `${message}: ${errorData.result.error} - ${errorData.result.errorCode}`,
    );
  } else {
    alert(`Unkown error response: ${JSON.stringify(error)}`);
  }
};

export function TariffsModal({
  isOpen,
  closeModal,
  tariffData,
  installationId,
  onSuccess,
}: Props) {
  const selectedTariff =
    tariffData?.dayElectricityPrice && tariffData?.nightElectricityPrice
      ? "double"
      : "single";

  const defaultValues = useMemo(
    () => ({
      tariffType: selectedTariff,
      electricityPrice: tariffData?.electricityPrice || undefined,
      dayElectricityPrice: tariffData?.dayElectricityPrice || undefined,
      nightElectricityPrice: tariffData?.nightElectricityPrice || undefined,
      gasPrice: tariffData?.gasPrice,
      validFrom: tariffData?.validFrom,
    }),
    [selectedTariff, tariffData],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
    control,
    watch,
  } = useForm<TariffFormData>({
    resolver: yupResolver(TariffFormSchema),
    defaultValues,
  });

  const tariffType = watch("tariffType");
  const startDate = watch("validFrom");

  const handleClose = useCallback(() => {
    reset();
    closeModal();
  }, [reset, closeModal]);

  const handleSubmitSuccess = useCallback(() => {
    handleClose();
    onSuccess();
  }, [onSuccess, handleClose]);

  useEffect(() => {
    reset(defaultValues);
  }, [reset, defaultValues, tariffData]);

  const apiClient = useApiClient();
  const onSubmit = useCallback(
    async (data: TariffFormData) => {
      if (
        !window.confirm("Are you sure you would like to update the tariffs?")
      ) {
        return;
      }

      if (!startDate) {
        return;
      }

      const tariffBody =
        tariffType === "single"
          ? ({
              tariffType,
              electricityPrice: data.electricityPrice,
              gasPrice: data.gasPrice,
              validFrom: formatAsDate(startDate),
            } as CreateUpdateSingleTariff)
          : ({
              tariffType,
              dayElectricityPrice: data.dayElectricityPrice,
              nightElectricityPrice: data.nightElectricityPrice,
              gasPrice: data.gasPrice,
              validFrom: formatAsDate(startDate),
            } as CreateUpdateDoubleTariff);

      // If there is no tariff data, create a new tariff
      if (!tariffData) {
        try {
          await apiClient.adminCreateInstallationTariff({
            installationId: installationId,
            createTariffRequest: tariffBody,
          });

          handleSubmitSuccess();
        } catch (error) {
          await handleRequestFailure(error, "Failed to create a tariff");
        }
      } else {
        if (!tariffData?.id) {
          return;
        }

        try {
          // If there is tariff data, update the existing tariff
          await apiClient.adminUpdateInstallationTariff({
            installationId: installationId,
            tariffId: tariffData.id,
            createTariffRequest: tariffBody,
          });

          handleSubmitSuccess();
        } catch (error) {
          await handleRequestFailure(error, "Failed to update tariff data");
        }
      }
    },
    [
      apiClient,
      tariffData,
      installationId,
      tariffType,
      startDate,
      handleSubmitSuccess,
    ],
  );

  const onDelete = useCallback(async () => {
    if (
      !window.confirm("Are you sure you would like to delete the tariff data?")
    ) {
      return;
    }

    if (!tariffData?.id) {
      return;
    }

    try {
      await apiClient.adminDeleteInstallationTariff({
        installationId: installationId,
        tariffId: tariffData.id,
      });

      handleSubmitSuccess();
    } catch (error) {
      await handleRequestFailure(error, "Failed to delete tariff data");
    }
  }, [apiClient, installationId, tariffData, handleSubmitSuccess]);

  const isTariffNotDeletable = tariffData?.isDeletable === false;
  const isTariffDateNotEditable = tariffData?.isDateEditable === false;

  return (
    <Modal isOpen={isOpen} closeModal={handleClose}>
      <ModalHeader closeModal={handleClose}>Edit tariff data</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalContent>
          <FormSection>
            <FormField>
              <FormFieldTitle>Tariff</FormFieldTitle>
              <FormSelectInput {...register("tariffType")}>
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
                    min={0.01}
                    max={10}
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
                    min={0.01}
                    max={10}
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
                    min={0.01}
                    max={10}
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
                min={0.01}
                max={10}
                error={errors.gasPrice}
                {...register("gasPrice")}
              />
            </FormField>
            <FormField>
              <FormFieldTitle>📆 Valid from</FormFieldTitle>
              <Controller
                control={control}
                name="validFrom"
                render={({ field }) => (
                  <DatePicker
                    customInput={
                      <FormFieldInput
                        disabled={isTariffDateNotEditable}
                        style={{
                          cursor: isTariffDateNotEditable
                            ? "not-allowed"
                            : "pointer",
                        }}
                        type="text"
                        error={errors.validFrom}
                      />
                    }
                    selected={startDate}
                    disabled={isTariffDateNotEditable}
                    onSelect={(date) => {
                      field.onChange(date);
                    }}
                    onChange={(date) => {
                      date && field.onChange(date);
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
            <ModalDeleteButton
              disabled={isTariffNotDeletable}
              color="danger"
              onClick={onDelete}
            >
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
