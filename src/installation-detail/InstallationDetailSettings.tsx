import React from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { useApiClient } from "../api-client/context";
import { yupResolver } from "@hookform/resolvers/yup";

import classes from "./InstallationDetail.module.css";
import { Button } from "../ui-components/button/Button";
import { AdminInstallationDetail } from "../api-client/models";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import {
  FormField,
  FormFieldInput,
  FormFieldTitle,
  FormSection,
  FormSelectInput,
} from "../ui-components/form/Form";

export function InstallationDetailSettings({
  installation,
}: {
  installation: AdminInstallationDetail;
}) {
  const requiredFieldText = "This field is required";
  const transformNaN = (value: unknown) => (Number.isNaN(value) ? null : value);

  const InstallationDetailFormSchema = yup.object({
    ratedMaximumHousePower: yup
      .number()
      .transform(transformNaN)
      .required(requiredFieldText)
      .nullable(requiredFieldText),
    maximumHeatingOutdoorTemperature: yup
      .number()
      .transform(transformNaN)
      .required(requiredFieldText),
    dayMaxSoundLevel: yup
      .string()
      .optional()
      .nullable()
      .oneOf(["normal", "library", "silent", "building87"]),
    nightMaxSoundLevel: yup
      .string()
      .optional()
      .nullable()
      .oneOf(["normal", "library", "silent", "building87"]),
    silentMode: yup
      .string()
      .optional()
      .nullable()
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

  type InstallationDetailFormData = yup.InferType<
    typeof InstallationDetailFormSchema
  >;
  type CICAdvancedFormDataActual = {
    ratedMaximumHousePower: AdminInstallationDetail["ratedMaximumHousePower"];
    maximumHeatingOutdoorTemperature: AdminInstallationDetail["maximumHeatingOutdoorTemperature"];
    dayMaxSoundLevel?: AdminInstallationDetail["dayMaxSoundLevel"];
    nightMaxSoundLevel?: AdminInstallationDetail["nightMaxSoundLevel"];
    silentMode?: AdminInstallationDetail["silentMode"];
    boilerType: AdminInstallationDetail["boilerType"];
    thermostatType: AdminInstallationDetail["thermostatType"];
    numberOfHeatPumps: NonNullable<
      AdminInstallationDetail["numberOfHeatPumps"]
    >;
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<InstallationDetailFormData>({
    resolver: yupResolver(InstallationDetailFormSchema),
    defaultValues: {
      ratedMaximumHousePower: installation.ratedMaximumHousePower,
      maximumHeatingOutdoorTemperature:
        installation.maximumHeatingOutdoorTemperature === null
          ? undefined
          : installation.maximumHeatingOutdoorTemperature,
      boilerType: installation.boilerType,
      thermostatType: installation.thermostatType,
      numberOfHeatPumps:
        installation.numberOfHeatPumps === null
          ? undefined
          : installation.numberOfHeatPumps,
    },
  });

  const apiClient = useApiClient();
  const onSubmit = React.useCallback(
    async (data: InstallationDetailFormData) => {
      const response = await apiClient.adminUpdateInstallation({
        /*
        //HAUNTED-HOUSE ignore until haunted house code is merged
        iuid: installation.iuid?.toString() as string,
        */
        orderNumber: installation.orderNumber?.toString() as string,
        updateAdminInstallation: data as unknown as CICAdvancedFormDataActual,
      });
      if (response.meta.status === 200) {
        // this sets isDirty back to false
        reset({}, { keepValues: true });
      }
    },
    /*
    //HAUNTED-HOUSE ignore until haunted house code is merged
    [apiClient, installation.iuid, reset],
    */
    [apiClient, installation.orderNumber, reset],
  );

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="🪛 Settings" />
      <FormSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormFieldTitle>Rated maximum house power</FormFieldTitle>
            <FormFieldInput
              type="number"
              error={errors.ratedMaximumHousePower}
              {...register("ratedMaximumHousePower", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField>
            <FormFieldTitle>
              Maximum heating outdoor temperature *
            </FormFieldTitle>
            <FormFieldInput
              type="number"
              step="0.01"
              error={errors.maximumHeatingOutdoorTemperature}
              {...register("maximumHeatingOutdoorTemperature", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          {installation.hasSoundSlider ? (
            <>
              <FormField>
                <FormFieldTitle>Day max sound level</FormFieldTitle>
                <FormSelectInput
                  defaultValue={installation.dayMaxSoundLevel}
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
                  defaultValue={installation.nightMaxSoundLevel}
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
                  defaultValue={installation.silentMode}
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
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            Update settings
          </Button>
        </form>
      </FormSection>
    </div>
  );
}
