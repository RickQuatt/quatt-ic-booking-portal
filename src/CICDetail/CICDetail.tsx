import React from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import classes from "./CICDetail.module.css";
import { AdminCic } from "../apiClient/models";
import { formatDate, formatDateDistance } from "../utils/formatDate";
import { useApiClient } from "../apiClient/context";
import { Button, ButtonLink } from "../Button/Button";
import {
  getGrafanaLink,
  getHubspotSearchOrderLink,
  getMenderLink,
} from "./getLinks";
import { AdvancedSettingsModal } from "./AdvancedSettingsModal";
import { useModalState } from "../Modal/useModalState";
import { FormField, FormFieldInput, FormFieldJson, FormFieldTitle, FormFieldValue, FormSection } from "./Form";

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

  const {
    isOpen: isAdvancedSettingsModalOpen,
    open: openAdvancedSettingsModal,
    close: closeAdvancedSettingsModal,
  } = useModalState();

  return (
    <div className={classes["detail-sections"]}>
      <AdvancedSettingsModal
        isOpen={isAdvancedSettingsModalOpen}
        closeModal={closeAdvancedSettingsModal}
        cicId={cicId}
        cicData={cicData}
      />
      <div className={classes["detail-section"]}>
        <h3>CIC Details Main</h3>
        <FormSection>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormField>
              <FormFieldTitle>ID</FormFieldTitle>
              <FormFieldValue value={cicData.id} />
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
              <FormFieldTitle>
                Last connection status updated at
              </FormFieldTitle>
              <FormFieldValue
                value={formatDateDistance(
                  cicData.lastConnectionStatusUpdatedAt
                )}
              />
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
              <FormFieldTitle>Electricity price</FormFieldTitle>
              <FormFieldInput
                type="number"
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
                error={errors.nightElectricityPrice}
                {...register("nightElectricityPrice", {
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
      <div className={classes["detail-section"]}>
        <h3>CIC Details Extra</h3>
        <FormSection>
          <FormField>
            <FormFieldTitle>Quatt build</FormFieldTitle>
            <FormFieldValue value={cicData.quattBuild} />
          </FormField>
          <FormField>
            <FormFieldTitle>
              Last connection status updated at
            </FormFieldTitle>
            <FormFieldValue
              value={formatDateDistance(cicData.lastConnectionStatusUpdatedAt)}
            />
          </FormField>
          <FormField>
            <FormFieldTitle>Boiler power</FormFieldTitle>
            <FormFieldValue value={cicData.boilerPower} />
          </FormField>
          <FormField>
            <FormFieldTitle>Cable connection status</FormFieldTitle>
            <FormFieldValue value={cicData.cableConnectionStatus} />
          </FormField>
          <FormField>
            <FormFieldTitle>Flow rate</FormFieldTitle>
            <FormFieldValue value={cicData.flowRate} />
          </FormField>
          <FormField>
            <FormFieldTitle>LTE connection status</FormFieldTitle>
            <FormFieldValue value={cicData.lteConnectionStatus} />
          </FormField>
          <FormField>
            <FormFieldTitle>Wifi connection status</FormFieldTitle>
            <FormFieldValue value={cicData.wifiConnectionStatus} />
          </FormField>
          <FormField>
            <FormFieldTitle>Wifi SSID</FormFieldTitle>
            <FormFieldValue value={cicData.wifiSSID} />
          </FormField>
          <FormField>
            <FormFieldTitle>Electricity price</FormFieldTitle>
            <FormFieldValue value={cicData.electricityPrice} />
          </FormField>
          <FormField>
            <FormFieldTitle>Day electricity price</FormFieldTitle>
            <FormFieldValue value={cicData.dayElectricityPrice} />
          </FormField>
          <FormField>
            <FormFieldTitle>Night electricity price</FormFieldTitle>
            <FormFieldValue value={cicData.nightElectricityPrice} />
          </FormField>
          <FormField>
            <FormFieldTitle>Gas price</FormFieldTitle>
            <FormFieldValue value={cicData.gasPrice} />
          </FormField>
          <FormField>
            <FormFieldTitle>Boiler demand</FormFieldTitle>
            <FormFieldValue value={cicData.boilerDemand} />
          </FormField>
          <FormField>
            <FormFieldTitle>Boiler water temperature in</FormFieldTitle>
            <FormFieldValue value={cicData.boilerWaterTemperatureIn} />
          </FormField>
          <FormField>
            <FormFieldTitle>Boiler water temperature out</FormFieldTitle>
            <FormFieldValue value={cicData.boilerWaterTemperatureOut} />
          </FormField>
          <FormField>
            <FormFieldTitle>
              Thermostat control temperature set point
            </FormFieldTitle>
            <FormFieldValue
              value={cicData.thermostatControlTemperatureSetPoint}
            />
          </FormField>
          <FormField>
            <FormFieldTitle>Thermostat demand</FormFieldTitle>
            <FormFieldValue value={cicData.thermostatDemand} />
          </FormField>
          <FormField>
            <FormFieldTitle>Thermostat room temperature</FormFieldTitle>
            <FormFieldValue value={cicData.thermostatRoomTemperature} />
          </FormField>
          <FormField>
            <FormFieldTitle>Serial</FormFieldTitle>
            <FormFieldValue value={cicData.serial} />
          </FormField>
          <FormField>
            <FormFieldTitle>Supervisory control mode</FormFieldTitle>
            <FormFieldValue value={cicData.supervisoryControlMode} />
          </FormField>
          <FormField>
            <FormFieldTitle>Is HP1 connected</FormFieldTitle>
            <FormFieldValue value={cicData.isHp1Connected} />
          </FormField>
          <FormField>
            <FormFieldTitle>Is thermostat connected</FormFieldTitle>
            <FormFieldValue value={cicData.isThermostatConnected} />
          </FormField>
          <FormField>
            <FormFieldTitle>Is boiler connected</FormFieldTitle>
            <FormFieldValue value={cicData.isBoilerConnected} />
          </FormField>
          <FormField>
            <FormFieldTitle>Is temperature sensor connected</FormFieldTitle>
            <FormFieldValue value={cicData.isTemperatureSensorConnected} />
          </FormField>
          <FormField>
            <FormFieldTitle>Is controller alive</FormFieldTitle>
            <FormFieldValue value={cicData.isControllerAlive} />
          </FormField>
          <FormField>
            <FormFieldTitle>Boiler type</FormFieldTitle>
            <FormFieldValue value={cicData.boilerType} />
          </FormField>
          <FormField>
            <FormFieldTitle>Zip code</FormFieldTitle>
            <FormFieldValue value={cicData.zipCode} />
          </FormField>
          <FormField>
            <FormFieldTitle>Last commissioning completed at</FormFieldTitle>
            <FormFieldValue
              value={formatDateDistance(cicData.lastConnectionStatusUpdatedAt)}
            />
          </FormField>
          <FormField>
            <FormFieldTitle>Thermostat type</FormFieldTitle>
            <FormFieldValue value={cicData.thermostatType} />
          </FormField>
          <FormField>
            <FormFieldTitle>Rated maximum house power</FormFieldTitle>
            <FormFieldValue value={cicData.ratedMaximumHousePower} />
          </FormField>
          <FormField>
            <FormFieldTitle>
              Maximum heating outdoor temperature
            </FormFieldTitle>
            <FormFieldValue
              value={cicData.maximumHeatingOutdoorTemperature}
            />
          </FormField>
          <FormField>
            <FormFieldTitle>Last commissioning</FormFieldTitle>
            <FormFieldJson value={cicData.lastCommissioning} />
          </FormField>
          <FormField>
            <FormFieldTitle>Created at</FormFieldTitle>
            <FormFieldValue value={formatDate(cicData.createdAt)} />
          </FormField>
          <FormField>
            <FormFieldTitle>Mender ID</FormFieldTitle>
            <FormFieldValue value={cicData.menderId} />
          </FormField>
        </FormSection>
      </div>

      <div className={classes["detail-section"]}>
        <FormSection>
          <ButtonLink
            href={
              cicData.orderNumber
                ? getHubspotSearchOrderLink(cicData.orderNumber)
                : undefined
            }
            target="_blank"
            disabled={!cicData.orderNumber}
          >
            Hubspot Search Order
          </ButtonLink>
          <ButtonLink href={getMenderLink(cicData.id)} target="_blank">
            Mender
          </ButtonLink>
          <ButtonLink href={getGrafanaLink(cicData.id)} target="_blank">
            Grafana
          </ButtonLink>
          <FormField>
            <FormFieldTitle>Supervisory Control Mode</FormFieldTitle>
            <FormFieldValue value={cicData.supervisoryControlMode} />
          </FormField>
          <Button color="danger" onClick={openAdvancedSettingsModal}>
            Advanced settings
          </Button>
        </FormSection>
      </div>
    </div>
  );
}
