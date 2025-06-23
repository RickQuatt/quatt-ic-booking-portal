import classes from "./CICDebugPage.module.css";
import { AdminCic, CommandType } from "../api-client/models";
import { useApiClient } from "../api-client/context";
import {
  FormField,
  FormFieldTitle,
  FormSelectInput,
  FormSection,
} from "../ui-components/form/Form";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "../ui-components/button/Button";
import { useCallback } from "react";

interface CICDebugPageProps {
  data: AdminCic;
}

const CICSendCommandToCICRequestDataSchema = yup.object({
  type: yup
    .mixed<CommandType>()
    .oneOf(Object.values(CommandType))
    .required("This field is required"),
});

type CICSendCommandToCICRequestData = yup.InferType<
  typeof CICSendCommandToCICRequestDataSchema
>;

export function CICDebugPage({ data: { id } }: CICDebugPageProps) {
  const apiClient = useApiClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm<CICSendCommandToCICRequestData>({
    resolver: yupResolver(CICSendCommandToCICRequestDataSchema),
    defaultValues: {
      type: CommandType.SyncConfiguration,
    },
  });
  const onSubmit = useCallback(
    async (data: CICSendCommandToCICRequestData) => {
      await apiClient.sendCommandToCIC({
        cicId: id,
        sendCommandToCICRequest: {
          type: data.type,
        },
      });
      setTimeout(() => reset({ type: data.type }), 1500); // reset the form after 1.5 seconds
    },
    [apiClient, id, reset],
  );

  return (
    <div className={classes["page"]}>
      <div className={classes["page-form"]}>
        <h2>{id}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormSection>
            <FormField>
              <FormFieldTitle>Command type</FormFieldTitle>
              <FormSelectInput
                defaultValue={CommandType.SyncConfiguration}
                {...register("type")}
              >
                {Object.values(CommandType).map((commandType) => (
                  <option key={commandType} value={commandType}>
                    {commandType}
                  </option>
                ))}
              </FormSelectInput>
            </FormField>
            {isSubmitSuccessful && (
              <p className={classes["form-success"]}>
                Command sent successfully.
              </p>
            )}
            <Button type="submit" disabled={isSubmitting}>
              Send command
            </Button>
          </FormSection>
        </form>
      </div>
    </div>
  );
}
