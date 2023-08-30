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
} from "../ui-components/modal/Modal";
import { AdminCic } from "../api-client/models";
import { useApiClient } from "../api-client/context";
import {
  FormField,
  FormFieldInput,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
  FormSelectInput,
} from "../ui-components/form/Form";

interface Props extends ModalProps {
  cicId: string;
  cicData: AdminCic;
}

const requiredFieldText = "This field is required";
// required for inputs of type="number"
const transformNaN = (value: unknown) => (Number.isNaN(value) ? null : value);

const CICAdvancedFormSchema = yup.object({
  silentMode: yup
    .string()
    .required(requiredFieldText)
    .nullable(requiredFieldText)
    .oneOf(["never", "night", "always"]),
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
  numberOfHeatPumps: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText)
    .min(1)
    .max(2),
});

// TODO: get yup to infer the right type (the enums)? - 2023-07-14
type CICAdvancedFormData = yup.InferType<typeof CICAdvancedFormSchema>;
type CICAdvancedFormDataActual = {
  silentMode: AdminCic["silentMode"];
  boilerType: AdminCic["boilerType"];
  thermostatType: AdminCic["thermostatType"];
  numberOfHeatPumps: NonNullable<AdminCic["numberOfHeatPumps"]>;
};

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
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CICAdvancedFormData>({
    resolver: yupResolver(CICAdvancedFormSchema),
    defaultValues: {
      silentMode: cicData.silentMode,
      boilerType: cicData.boilerType,
      thermostatType: cicData.thermostatType,
      numberOfHeatPumps:
        cicData.numberOfHeatPumps === null
          ? undefined
          : cicData.numberOfHeatPumps,
    },
  });

  const apiClient = useApiClient();
  const onSubmit = React.useCallback(
    async (data: CICAdvancedFormData) => {
      if (
        !window.confirm(
          "Are you sure you would like to update these critical CIC settings?",
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
        closeModal();
      }
    },
    [apiClient, cicId, closeModal, reset],
  );

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
              <FormFieldTitle>Silent mode</FormFieldTitle>
              <FormSelectInput {...register("silentMode")}>
                <option value="never">Never</option>
                <option value="night">Night</option>
                <option value="always">Always</option>
              </FormSelectInput>
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
              <FormFieldTitle>Number of heat pumps</FormFieldTitle>
              <FormFieldInput
                type="number"
                error={errors.numberOfHeatPumps}
                {...register("numberOfHeatPumps", {
                  valueAsNumber: true,
                })}
              />
            </FormField>
          </FormSection>
        </ModalContent>
        <ModalActions>
          <ModalCloseButton onClick={closeModal} />
          <ModalConfirmButton type="submit" disabled={!isDirty || isSubmitting}>
            Submit
          </ModalConfirmButton>
        </ModalActions>
      </form>
    </Modal>
  );
}
