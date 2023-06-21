import React from "react";
import * as yup from "yup";
import { FieldError, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import classes from "./CICDetail.module.css";
import { AdminCic } from "../apiClient/models";
import { formatDate, formatDateDistance } from "../utils/formatDate";
import { useApiClient } from "../apiClient/context";

interface CICDetailProps {
  cicId: string;
  data: AdminCic;
}

const requiredFieldText = "This field is required";
// required for inputs of type="number"
const transformNaN = (value: unknown) => (Number.isNaN(value) ? null : value);

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
// type CICDetailFormData = Pick<AdminCic, 'electricityPrice' | 'dayElectricityPrice' | 'nightElectricityPrice' | 'gasPrice' | 'ratedMaximumHousePower' | 'maximumHeatingOutdoorTemperature'>;

export function CICDetail({ cicId, data }: CICDetailProps) {
  const cicData = data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CICDetailFormData>({
    resolver: yupResolver(CICDetailFormSchema),
    defaultValues: {
      electricityPrice: data.electricityPrice,
      dayElectricityPrice: data.dayElectricityPrice,
      nightElectricityPrice: data.nightElectricityPrice,
      gasPrice: data.gasPrice,
      ratedMaximumHousePower: data.ratedMaximumHousePower,
      maximumHeatingOutdoorTemperature:
        data.maximumHeatingOutdoorTemperature === null
          ? undefined
          : data.maximumHeatingOutdoorTemperature,
    },
  });

  const apiClient = useApiClient();
  const onSubmit = async (data: CICDetailFormData) => {
    const response = await apiClient.adminUpdateCic({
      cicId,
      updateAdminCic: data,
    });
    if (response.meta.status === 200) {
      // this sets isDirty back to false
      reset({}, { keepValues: true });
    }
  };

  return (
    <div className={classes['detail-sections']}>
      <div className={classes["detail-section"]}>
        <h3>CIC Details Main</h3>
        <div className={classes["detail-list"]}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DetailField>
              <DetailFieldTitle>ID</DetailFieldTitle>
              <DetailFieldValue value={cicData.id} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Order number</DetailFieldTitle>
              <DetailFieldValue value={cicData.orderNumber} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Quatt build</DetailFieldTitle>
              <DetailFieldValue value={cicData.quattBuild} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>
                Last connection status updated at
              </DetailFieldTitle>
              <DetailFieldValue
                value={formatDateDistance(
                  cicData.lastConnectionStatusUpdatedAt
                )}
              />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Mender ID</DetailFieldTitle>
              <DetailFieldValue value={cicData.menderId} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Number of heat pumps</DetailFieldTitle>
              <DetailFieldValue value={cicData.numberOfHeatPumps} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Electricity price</DetailFieldTitle>
              <DetailFieldInput
                type="number"
                error={errors.electricityPrice}
                {...register("electricityPrice", {
                  valueAsNumber: true,
                })}
              />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Day electricity price</DetailFieldTitle>
              <DetailFieldInput
                type="number"
                error={errors.dayElectricityPrice}
                {...register("dayElectricityPrice", {
                  valueAsNumber: true,
                })}
              />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Night electricity price</DetailFieldTitle>
              <DetailFieldInput
                type="number"
                error={errors.nightElectricityPrice}
                {...register("nightElectricityPrice", {
                  valueAsNumber: true,
                })}
              />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Rated maximum house power</DetailFieldTitle>
              <DetailFieldInput
                type="number"
                error={errors.ratedMaximumHousePower}
                {...register("ratedMaximumHousePower", {
                  valueAsNumber: true,
                })}
              />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>
                Maximum heating outdoor temperature
              </DetailFieldTitle>
              <DetailFieldInput
                type="number"
                error={errors.maximumHeatingOutdoorTemperature}
                {...register("maximumHeatingOutdoorTemperature", {
                  valueAsNumber: true,
                })}
              />
            </DetailField>

            <input
              type="submit"
              value="Save updated settings to CIC"
              disabled={!isDirty || isSubmitting}
              // className={classes['detail-field-submit']}
            />
          </form>
        </div>
      </div>
      <div className={classes["detail-section"]}>
        <h3>CIC Details</h3>
        <div className={classes["detail-list"]}>
            <DetailField>
              <DetailFieldTitle>Quatt build</DetailFieldTitle>
              <DetailFieldValue value={cicData.quattBuild} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Last connection status updated at</DetailFieldTitle>
              <DetailFieldValue
                value={formatDateDistance(
                  cicData.lastConnectionStatusUpdatedAt
                )}
              />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Boiler power</DetailFieldTitle>
              <DetailFieldValue value={cicData.boilerPower} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Cable connection status</DetailFieldTitle>
              <DetailFieldValue value={cicData.cableConnectionStatus} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Flow rate</DetailFieldTitle>
              <DetailFieldValue value={cicData.flowRate} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>LTE connection status</DetailFieldTitle>
              <DetailFieldValue value={cicData.lteConnectionStatus} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Wifi connection status</DetailFieldTitle>
              <DetailFieldValue value={cicData.wifiConnectionStatus} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Wifi SSID</DetailFieldTitle>
              <DetailFieldValue value={cicData.wifiSSID} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Electricity price</DetailFieldTitle>
              <DetailFieldValue value={cicData.electricityPrice} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Day electricity price</DetailFieldTitle>
              <DetailFieldValue value={cicData.dayElectricityPrice} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Night electricity price</DetailFieldTitle>
              <DetailFieldValue value={cicData.nightElectricityPrice} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Gas price</DetailFieldTitle>
              <DetailFieldValue value={cicData.gasPrice} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Boiler demand</DetailFieldTitle>
              <DetailFieldValue value={cicData.boilerDemand} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Boiler water temperature in</DetailFieldTitle>
              <DetailFieldValue value={cicData.boilerWaterTemperatureIn} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Boiler water temperature out</DetailFieldTitle>
              <DetailFieldValue value={cicData.boilerWaterTemperatureOut} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Thermostat control temperature set point</DetailFieldTitle>
              <DetailFieldValue value={cicData.thermostatControlTemperatureSetPoint} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Thermostat demand</DetailFieldTitle>
              <DetailFieldValue value={cicData.thermostatDemand} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Thermostat room temperature</DetailFieldTitle>
              <DetailFieldValue value={cicData.thermostatRoomTemperature} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Serial</DetailFieldTitle>
              <DetailFieldValue value={cicData.serial} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Supervisory control mode</DetailFieldTitle>
              <DetailFieldValue value={cicData.supervisoryControlMode} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Is HP1 connected</DetailFieldTitle>
              <DetailFieldValue value={cicData.isHp1Connected} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Is thermostat connected</DetailFieldTitle>
              <DetailFieldValue value={cicData.isThermostatConnected} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Is boiler connected</DetailFieldTitle>
              <DetailFieldValue value={cicData.isBoilerConnected} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Is temperature sensor connected</DetailFieldTitle>
              <DetailFieldValue value={cicData.isTemperatureSensorConnected} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Is controller alive</DetailFieldTitle>
              <DetailFieldValue value={cicData.isControllerAlive} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Boiler type</DetailFieldTitle>
              <DetailFieldValue value={cicData.boilerType} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Zip code</DetailFieldTitle>
              <DetailFieldValue value={cicData.zipCode} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>
                Last commissioning completed at
              </DetailFieldTitle>
              <DetailFieldValue
                value={formatDateDistance(
                  cicData.lastConnectionStatusUpdatedAt
                )}
              />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Thermostat type</DetailFieldTitle>
              <DetailFieldValue value={cicData.thermostatType} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Rated maximum house power</DetailFieldTitle>
              <DetailFieldValue value={cicData.ratedMaximumHousePower} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Maximum heating outdoor temperature</DetailFieldTitle>
              <DetailFieldValue value={cicData.maximumHeatingOutdoorTemperature} />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Created at</DetailFieldTitle>
              <DetailFieldValue
                value={formatDate(cicData.createdAt)}
              />
            </DetailField>
            <DetailField>
              <DetailFieldTitle>Mender ID</DetailFieldTitle>
              <DetailFieldValue value={cicData.menderId} />
            </DetailField>

        </div>
      </div>
    </div>
  );
}

interface DetailFieldInputProps extends React.ComponentPropsWithRef<"input"> {
  error?: FieldError;
}

const DetailFieldInput = React.forwardRef<
  HTMLInputElement,
  DetailFieldInputProps
>(function DetailFieldInput(
  { error, ...inputProps }: DetailFieldInputProps,
  ref
) {
  return (
    <>
      <input
        className={classes["detail-field-input"]}
        ref={ref}
        {...inputProps}
      />
      {error && <p>{error.message}</p>}
    </>
  );
});

function DetailField({ children }: React.PropsWithChildren) {
  return <div className={classes["detail-field"]}>{children}</div>;
}

function DetailFieldTitle({ children }: React.PropsWithChildren) {
  return <span className={classes["detail-field-title"]}>{children}</span>;
}

type DetailFieldValueProps = {
  value?: string | number | boolean | null;
};
function DetailFieldValue({ value }: DetailFieldValueProps) {
  return (
    <span className={classes["detail-field-value"]}>
      {value ?? "N/A"}
    </span>
  );
}
