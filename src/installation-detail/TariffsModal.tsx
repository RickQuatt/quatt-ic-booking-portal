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
import { CreateUpdateEnergyTariff, Tariff } from "../api-client/models";
import { useApiClient } from "../api-client/context";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ResponseError } from "../api-client/runtime";
import { ErrorResponse } from "../api-client/models/ErrorResponse";
import {
  createTariffForInstallation,
  updateTariffForInstallation,
} from "./api/tariffApi";

interface Props extends ModalProps {
  installationId: string;
  tariffData: Tariff | null;
  onSuccess: () => void;
}

const TariffFormSchema = yup.object({
  electricityTariffType: yup
    .string()
    .required("Electricity tariff type is required"),
  gasTariffType: yup.string().required("Gas tariff type is required"),

  // Single electricity price
  price: yup
    .number()
    .typeError("Must be a valid number")
    .transform((value, originalValue) => {
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return undefined;
      }
      return value;
    })
    .when("electricityTariffType", {
      is: "single",
      then: (schema) =>
        schema
          .required("Electricity tariff is required")
          .min(0.01, "Price must be greater than 0"),
      otherwise: (schema) => schema.nullable(),
    }),

  // Double electricity prices
  dayPrice: yup
    .number()
    .typeError("Must be a valid number")
    .transform((value, originalValue) => {
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return undefined;
      }
      return value;
    })
    .when("electricityTariffType", {
      is: "double",
      then: (schema) =>
        schema
          .required("Day electricity tariff is required")
          .min(0.01, "Price must be greater than 0"),
      otherwise: (schema) => schema.nullable(),
    }),

  nightPrice: yup
    .number()
    .typeError("Must be a valid number")
    .transform((value, originalValue) => {
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return undefined;
      }
      return value;
    })
    .when("electricityTariffType", {
      is: "double",
      then: (schema) =>
        schema
          .required("Night electricity tariff is required")
          .min(0.01, "Price must be greater than 0"),
      otherwise: (schema) => schema.nullable(),
    }),

  // Gas price (only required for single gas tariff)
  gasPrice: yup
    .number()
    .typeError("Must be a valid number")
    .transform((value, originalValue) => {
      if (
        originalValue === "" ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return undefined;
      }
      return value;
    })
    .when("gasTariffType", {
      is: "single",
      then: (schema) =>
        schema
          .required("Gas price is required")
          .min(0.01, "Price must be greater than 0"),
      otherwise: (schema) => schema.nullable(),
    }),

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
  // Determine tariff type from new or legacy fields
  // Determine electricity tariff type
  const selectedElectricityTariff = useMemo(() => {
    if (tariffData?.electricityTariffType) {
      return tariffData.electricityTariffType;
    }

    // Fallback: Check for actual values in new structure
    if (
      tariffData?.electricity &&
      "dayPrice" in tariffData.electricity &&
      tariffData.electricity.dayPrice != null
    ) {
      return "double";
    }

    // Fallback: Check legacy fields with actual values
    if (
      tariffData?.dayElectricityPrice != null &&
      tariffData?.nightElectricityPrice != null
    ) {
      return "double";
    }

    return "single";
  }, [tariffData]);

  // Determine gas tariff type
  const selectedGasTariff = useMemo(() => {
    if (tariffData?.gasTariffType) {
      return tariffData.gasTariffType;
    }

    return "single"; // Default to single for gas
  }, [tariffData]);

  const defaultValues = useMemo(
    () => ({
      electricityTariffType: selectedElectricityTariff,
      gasTariffType: selectedGasTariff,
      // For single tariff, use new structure first, fallback to legacy, default to undefined for new forms
      price:
        tariffData?.electricity && "price" in tariffData.electricity
          ? tariffData.electricity.price
          : (tariffData?.electricityPrice ?? undefined),
      // For double tariff, use new structure first, fallback to legacy, default to undefined for new forms
      dayPrice:
        tariffData?.electricity && "dayPrice" in tariffData.electricity
          ? tariffData.electricity.dayPrice
          : (tariffData?.dayElectricityPrice ?? undefined),
      nightPrice:
        tariffData?.electricity && "nightPrice" in tariffData.electricity
          ? tariffData.electricity.nightPrice
          : (tariffData?.nightElectricityPrice ?? undefined),
      // For gas price, use new structure first, fallback to legacy, default to undefined for new forms
      gasPrice:
        tariffData?.gas && "price" in tariffData.gas
          ? tariffData.gas.price
          : (tariffData?.gasPrice ?? undefined),
      validFrom: tariffData?.validFrom || new Date(),
    }),
    [selectedElectricityTariff, selectedGasTariff, tariffData],
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

  const electricityTariffType = watch("electricityTariffType");
  const gasTariffType = watch("gasTariffType");
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
    async (formData: TariffFormData) => {
      if (
        !window.confirm("Are you sure you would like to update the tariffs?")
      ) {
        return;
      }

      if (!startDate) {
        return;
      }

      // Construct electricity tariff based on selected type
      let electricityTariff;
      if (electricityTariffType === "single") {
        electricityTariff = {
          tariffType: "single" as const,
          price: Number(formData.price),
        };
      } else if (electricityTariffType === "double") {
        electricityTariff = {
          tariffType: "double" as const,
          dayPrice: Number(formData.dayPrice),
          nightPrice: Number(formData.nightPrice),
        };
      } else if (electricityTariffType === "dynamic") {
        electricityTariff = {
          tariffType: "dynamic" as const,
        };
      } else {
        throw new Error("Invalid electricity tariff type");
      }

      // Construct gas tariff based on selected type
      let gasTariff;
      if (gasTariffType === "single") {
        gasTariff = {
          tariffType: "single" as const,
          price: Number(formData.gasPrice),
        };
      } else if (gasTariffType === "dynamic") {
        gasTariff = {
          tariffType: "dynamic" as const,
        };
      } else {
        throw new Error("Invalid gas tariff type");
      }

      const tariffBody: CreateUpdateEnergyTariff = {
        validFrom: startDate,
        electricity: electricityTariff,
        gas: gasTariff,
      };

      // Create or update tariff using manual API functions to bypass serialization bugs
      if (!tariffData) {
        try {
          await createTariffForInstallation(installationId, tariffBody);
          handleSubmitSuccess();
        } catch (error) {
          await handleRequestFailure(error, "Failed to create a tariff");
        }
      } else {
        if (!tariffData?.id) {
          return;
        }

        try {
          await updateTariffForInstallation(
            installationId,
            tariffData.id,
            tariffBody,
          );
          handleSubmitSuccess();
        } catch (error) {
          await handleRequestFailure(error, "Failed to update tariff data");
        }
      }
    },
    [
      tariffData,
      installationId,
      electricityTariffType,
      gasTariffType,
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
      await apiClient.adminDeleteTariff({
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
            {/* Electricity tariff type selector */}
            <FormField>
              <FormFieldTitle>⚡️ Electricity tariff type</FormFieldTitle>
              <FormSelectInput {...register("electricityTariffType")}>
                <option value="single">Single tariff</option>
                <option value="double">Double tariff</option>
                <option value="dynamic">Dynamic tariff</option>
              </FormSelectInput>
            </FormField>

            {/* Electricity pricing fields based on type */}
            {electricityTariffType === "single" && (
              <FormField>
                <FormFieldTitle>⚡️ Electricity price</FormFieldTitle>
                <FormFieldInput
                  type="number"
                  step="0.00001"
                  min={0.01}
                  max={10}
                  error={errors.price}
                  {...register("price")}
                />
              </FormField>
            )}

            {electricityTariffType === "double" && (
              <>
                <FormField>
                  <FormFieldTitle>⚡️☀️ Day electricity price</FormFieldTitle>
                  <FormFieldInput
                    type="number"
                    step="0.00001"
                    min={0.01}
                    max={10}
                    error={errors.dayPrice}
                    {...register("dayPrice")}
                  />
                </FormField>
                <FormField>
                  <FormFieldTitle>⚡️🌙 Night electricity price</FormFieldTitle>
                  <FormFieldInput
                    type="number"
                    step="0.00001"
                    min={0.01}
                    max={10}
                    error={errors.nightPrice}
                    {...register("nightPrice")}
                  />
                </FormField>
              </>
            )}

            {/* Gas tariff type selector */}
            <FormField>
              <FormFieldTitle>🔥 Gas tariff type</FormFieldTitle>
              <FormSelectInput {...register("gasTariffType")}>
                <option value="single">Single tariff</option>
                <option value="dynamic">Dynamic tariff</option>
              </FormSelectInput>
            </FormField>

            {/* Gas pricing fields based on type */}
            {gasTariffType === "single" && (
              <FormField>
                <FormFieldTitle>🔥 Gas price</FormFieldTitle>
                <FormFieldInput
                  type="number"
                  step="0.00001"
                  min={0.01}
                  max={10}
                  error={errors.gasPrice}
                  {...register("gasPrice")}
                />
              </FormField>
            )}

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
