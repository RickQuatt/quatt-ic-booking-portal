import React from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { useApiClient } from "../api-client/context";
import { AdminCic } from "../api-client/models";
import {
  FormField,
  FormFieldInput,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import { Button } from "../ui-components/button/Button";
import classes from "./CICDetail.module.css";
import { formatDate, formatDateDistance } from "../utils/formatDate";
import { DetailSectionHeader } from "./CICDetailSectionHeader";
import { Link } from "wouter";

const requiredFieldText = "This field is required";
// required for inputs of type="number"
const transformNaN = (value: unknown) => (Number.isNaN(value) ? null : value);
// type CICDetailFormData = Pick<AdminCic, 'electricityPrice' | 'dayElectricityPrice' | 'nightElectricityPrice' | 'gasPrice' | 'ratedMaximumHousePower' | 'maximumHeatingOutdoorTemperature'>;

const CICDetailFormSchema = yup.object({
  electricityPrice: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText)
    .nullable(requiredFieldText),
  dayElectricityPrice: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText)
    .nullable(requiredFieldText),
  nightElectricityPrice: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText)
    .nullable(requiredFieldText),
  gasPrice: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText)
    .nullable(requiredFieldText),
  ratedMaximumHousePower: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText)
    .nullable(requiredFieldText),
  maximumHeatingOutdoorTemperature: yup
    .number()
    .transform(transformNaN)
    .required(requiredFieldText),
});

type CICDetailFormData = yup.InferType<typeof CICDetailFormSchema>;

export function CICDetailMain({ cicData }: { cicData: AdminCic }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CICDetailFormData>({
    resolver: yupResolver(CICDetailFormSchema),
    defaultValues: {
      electricityPrice: cicData.electricityPrice,
      dayElectricityPrice: cicData.dayElectricityPrice,
      nightElectricityPrice: cicData.nightElectricityPrice,
      gasPrice: cicData.gasPrice,
      ratedMaximumHousePower: cicData.ratedMaximumHousePower,
      maximumHeatingOutdoorTemperature:
        cicData.maximumHeatingOutdoorTemperature === null
          ? undefined
          : cicData.maximumHeatingOutdoorTemperature,
    },
  });

  const apiClient = useApiClient();
  const onSubmit = React.useCallback(
    async (data: CICDetailFormData) => {
      const response = await apiClient.adminUpdateCic({
        cicId: cicData.id,
        updateAdminCic: data,
      });
      if (response.meta.status === 200) {
        // this sets isDirty back to false
        reset({}, { keepValues: true });
      }
    },
    [apiClient, cicData.id, reset],
  );

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="Main CIC details" />
      <FormSection>
        <FormField>
          <FormFieldTitle>ID</FormFieldTitle>
          <FormFieldValue value={cicData.id} />
        </FormField>
        <FormField>
          <FormFieldTitle>Installation</FormFieldTitle>
          <Link href={`/installations/${cicData.iuid}`}>{cicData.iuid}</Link>
        </FormField>
        <FormField>
          <FormFieldTitle>Order number</FormFieldTitle>
          <FormFieldValue value={cicData.orderNumber} />
        </FormField>
        <FormField>
          <FormFieldTitle>Quatt build</FormFieldTitle>
          <FormFieldValue value={cicData.quattBuild} />
        </FormField>
        <FormField>
          <FormFieldTitle>Last connection status updated at</FormFieldTitle>
          <FormFieldValue
            value={formatDateDistance(cicData.lastConnectionStatusUpdatedAt)}
          />
        </FormField>
        <FormField>
          <FormFieldTitle>Status</FormFieldTitle>
          <FormFieldValue value={cicData.status} />
        </FormField>
        <FormField>
          <FormFieldTitle>Mender ID</FormFieldTitle>
          <FormFieldValue value={cicData.menderId} />
        </FormField>
        <FormField>
          <FormFieldTitle>Number of heat pumps</FormFieldTitle>
          <FormFieldValue value={cicData.numberOfHeatPumps} />
        </FormField>
        <FormField>
          <FormFieldTitle>Created at</FormFieldTitle>
          <FormFieldValue value={formatDate(cicData.createdAt)} />
        </FormField>
        {cicData.hasSoundSlider ? (
          <>
            <FormField>
              <FormFieldTitle>Day max sound level</FormFieldTitle>
              <FormFieldValue value={cicData.dayMaxSoundLevel} />
            </FormField>
            <FormField>
              <FormFieldTitle>Night max sound level</FormFieldTitle>
              <FormFieldValue value={cicData.nightMaxSoundLevel} />
            </FormField>
          </>
        ) : (
          <FormField>
            <FormFieldTitle>Silent mode status</FormFieldTitle>
            <FormFieldValue value={cicData.silentMode} />
          </FormField>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormFieldTitle>Electricity price</FormFieldTitle>
            <FormFieldInput
              type="number"
              step="0.00001"
              error={errors.electricityPrice}
              {...register("electricityPrice", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField>
            <FormFieldTitle>Day electricity price</FormFieldTitle>
            <FormFieldInput
              type="number"
              step="0.00001"
              error={errors.dayElectricityPrice}
              {...register("dayElectricityPrice", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField>
            <FormFieldTitle>Night electricity price</FormFieldTitle>
            <FormFieldInput
              type="number"
              step="0.00001"
              error={errors.nightElectricityPrice}
              {...register("nightElectricityPrice", {
                valueAsNumber: true,
              })}
            />
          </FormField>
          <FormField>
            <FormFieldTitle>Gas price</FormFieldTitle>
            <FormFieldInput
              type="number"
              step="0.00001"
              error={errors.gasPrice}
              {...register("gasPrice", {
                valueAsNumber: true,
              })}
            />
          </FormField>
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
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            Save updated settings to CIC
          </Button>
        </form>
      </FormSection>
    </div>
  );
}
