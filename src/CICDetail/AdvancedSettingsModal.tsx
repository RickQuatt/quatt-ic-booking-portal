import React from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Modal,
  ModalActions,
  ModalCloseButton,
  ModalConfirmButton,
  ModalContent,
  ModalHeader,
  ModalProps,
} from "../Modal/Modal";
import { AdminCic } from "../apiClient/models";
import { useApiClient } from "../apiClient/context";
import {
  FormField,
  FormFieldInput,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
  FormSelectInput,
} from "./Form";

interface Props extends ModalProps {
  cicId: string;
  cicData: AdminCic;
}

const requiredFieldText = "This field is required";
// required for inputs of type="number"
const transformNaN = (value: unknown) => (Number.isNaN(value) ? null : value);

const CICAdvancedFormSchema = yup.object({
  boilerType: yup
    .string()
    .required(requiredFieldText)
    .nullable(requiredFieldText)
    .oneOf(["opentherm", "on_off"]),
  thermostatType: yup
    .string()
    .required(requiredFieldText)
    .nullable(requiredFieldText)
    .oneOf([
      "opentherm_room_temperature",
      "opentherm_without_room_temperature",
    ]),
  orderNumber: yup.string().required(requiredFieldText),
  // .nullable(requiredFieldText),
  numberOfHeatpumps: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText)
    .nullable(requiredFieldText),
});

type CICAdvancedFormData = yup.InferType<typeof CICAdvancedFormSchema>;
type CICAdvancedFormDataActual = Pick<
  AdminCic,
  "boilerType" | "thermostatType" | "orderNumber" | "numberOfHeatPumps"
>;

export function AdvancedSettingsModal({
  isOpen,
  closeModal,
  cicId,
  cicData,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CICAdvancedFormData>({
    resolver: yupResolver(CICAdvancedFormSchema),
    defaultValues: {
      boilerType: cicData.boilerType,
      thermostatType: cicData.thermostatType,
      orderNumber:
        cicData.orderNumber === null ? undefined : cicData.orderNumber,
      numberOfHeatpumps: cicData.numberOfHeatPumps,
    },
  });

  // console.log(watch("orderNumber")); // watch input value by passing the name of it

  const apiClient = useApiClient();
  const onSubmit = async (data: CICAdvancedFormData) => {
    console.log(data);
    if (
      !window.confirm(
        "Are you sure you would like to update these critical CIC settings?"
      )
    ) {
      return;
    }

    const response = await apiClient.adminUpdateCic({
      cicId,
      updateAdminCic: data as unknown as CICAdvancedFormDataActual,
    });
    if (response.meta.status === 200) {
      // this sets isDirty back to false
      reset({}, { keepValues: true });
    }
  };

  return (
    <Modal isOpen={isOpen} closeModal={closeModal}>
      <ModalHeader>Advanced Settings</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalContent>
          <FormSection>
            <FormField>
              <FormFieldTitle>ID</FormFieldTitle>
              <FormFieldValue value={cicData.id} />
            </FormField>
            <FormField>
              <FormFieldTitle>Boiler type</FormFieldTitle>
              <FormSelectInput {...register("boilerType")}>
                <option value="opentherm">Opentherm</option>
                <option value="on_off">OnOff</option>
              </FormSelectInput>
            </FormField>
            <FormField>
              <FormFieldTitle>Thermostat type</FormFieldTitle>
              <FormSelectInput {...register("thermostatType")}>
                <option value="opentherm_room_temperature">
                  OpenthermRoomTemperature
                </option>
                <option value="opentherm_without_room_temperature">
                  OpenthermWithoutRoomTemperature
                </option>
              </FormSelectInput>
            </FormField>
            <FormField>
              <FormFieldTitle>Order number *</FormFieldTitle>
              <FormFieldInput
                type="text"
                error={errors.orderNumber}
                {...register("orderNumber")}
              />
            </FormField>
            <FormField>
              <FormFieldTitle>Number of heat pumps</FormFieldTitle>
              <FormFieldInput
                type="number"
                error={errors.numberOfHeatpumps}
                {...register("numberOfHeatpumps", {
                  valueAsNumber: true,
                })}
              />
            </FormField>
          </FormSection>
        </ModalContent>
        <ModalActions>
          <ModalCloseButton onClick={closeModal} />
          <ModalConfirmButton
            onClick={undefined}
            disabled={!isDirty || isSubmitting}
          >
            Submit
          </ModalConfirmButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
