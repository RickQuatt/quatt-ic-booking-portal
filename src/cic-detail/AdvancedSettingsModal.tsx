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
import {
  AdminCic,
  BoilerType,
  CicStatus,
  MaxSoundLevel,
  SilentMode,
  ThermostatType,
} from "../api-client/models";
import { useApiClient } from "../api-client/context";
import {
  FormField,
  FormFieldInput,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
  FormSelectInput,
} from "../ui-components/form/Form";
import { useQueryClient } from "@tanstack/react-query";

interface Props extends ModalProps {
  cicId: string;
  cicData: AdminCic;
}

const requiredFieldText = "This field is required";
// required for inputs of type="number"
const transformNaN = (value: unknown) => (Number.isNaN(value) ? null : value);

const maxSoundLevels = Object.values(MaxSoundLevel);
const CICAdvancedFormSchema = yup.object({
  dayMaxSoundLevel: yup.mixed<MaxSoundLevel>().oneOf(maxSoundLevels).optional(),
  nightMaxSoundLevel: yup
    .mixed<MaxSoundLevel>()
    .oneOf(maxSoundLevels)
    .optional(),
  silentMode: yup
    .mixed<SilentMode>()
    .oneOf(Object.values(SilentMode))
    .optional(),
  boilerType: yup
    .mixed<BoilerType>()
    .oneOf(Object.values(BoilerType))
    .required(requiredFieldText)
    .nullable(),
  thermostatType: yup
    .mixed<ThermostatType>()
    .oneOf(Object.values(ThermostatType))
    .required(requiredFieldText)
    .nullable(),
  numberOfHeatPumps: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText)
    .min(1)
    .max(2),
  status: yup
    .mixed<CicStatus>()
    .oneOf(Object.values(CicStatus))
    .required(requiredFieldText),
});

type CICAdvancedFormData = yup.InferType<typeof CICAdvancedFormSchema>;
export function AdvancedSettingsModal({
  isOpen,
  closeModal,
  cicId,
  cicData,
}: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CICAdvancedFormData>({
    resolver: yupResolver(CICAdvancedFormSchema),
    defaultValues: {
      boilerType: cicData.boilerType,
      thermostatType: cicData.thermostatType,
      numberOfHeatPumps:
        cicData.numberOfHeatPumps === null
          ? undefined
          : cicData.numberOfHeatPumps,
      status: cicData.status,
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
        updateAdminCic: data,
      });
      if (response.meta.status === 200) {
        queryClient.invalidateQueries({ queryKey: ["cicDetail", cicId] });
        // this sets isDirty back to false
        reset({}, { keepValues: true });
        closeModal();
      }
    },
    [apiClient, cicId, closeModal, queryClient, reset],
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
            {cicData.hasSoundSlider ? (
              <>
                <FormField>
                  <FormFieldTitle>Day max sound level</FormFieldTitle>
                  <FormSelectInput
                    defaultValue={cicData.dayMaxSoundLevel}
                    {...register("dayMaxSoundLevel")}
                  >
                    <option value="normal">Normal</option>
                    <option value="library">Library</option>
                    <option value="silent">Silent</option>
                    <option value="building87">Building87</option>
                  </FormSelectInput>
                </FormField>
                <FormField>
                  <FormFieldTitle>Night max sound level</FormFieldTitle>
                  <FormSelectInput
                    defaultValue={cicData.nightMaxSoundLevel}
                    {...register("nightMaxSoundLevel")}
                  >
                    <option value="normal">Normal</option>
                    <option value="library">Library</option>
                    <option value="silent">Silent</option>
                    <option value="building87">Building87</option>
                  </FormSelectInput>
                </FormField>
              </>
            ) : (
              <>
                <FormField>
                  <FormFieldTitle>Silent mode</FormFieldTitle>
                  <FormSelectInput
                    defaultValue={cicData.silentMode}
                    {...register("silentMode")}
                  >
                    <option value="never">Never</option>
                    <option value="night">Night</option>
                    <option value="always">Always</option>
                  </FormSelectInput>
                </FormField>
              </>
            )}
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
            <FormField>
              <FormFieldTitle>CIC Status</FormFieldTitle>
              <FormSelectInput {...register("status")}>
                <option value={CicStatus.Active}>Active</option>
                <option value={CicStatus.Service}>Service</option>
                <option value={CicStatus.Dead}>Dead</option>
              </FormSelectInput>
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
