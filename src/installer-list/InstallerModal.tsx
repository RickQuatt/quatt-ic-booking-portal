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
  AdminCreateInstaller200Response,
  Installer,
} from "../api-client/models";
import { useApiClient } from "../api-client/context";
import {
  FormField,
  FormFieldInput,
  FormFieldTitle,
  FormSection,
  FormSelectInput,
} from "../ui-components/form/Form";

interface Props extends ModalProps {
  installerId?: string;
  installerData?: Installer;
  onSuccess: () => void;
}

const requiredFieldText = "This field is required";
const codeRegex = /^\w{4}-\w{4}$/;
const phoneRegexName = /^\+.*/;
const phoneValidateFailText =
  "The phone number should be of the form +XXYYYYYYYY";

function generateInstallerCode() {
  return (
    btoa(Math.random().toString()).substring(10, 14).toUpperCase() +
    "-" +
    btoa(Math.random().toString()).substring(10, 14).toUpperCase()
  );
}

const InstallerFormSchema = yup.object({
  code: yup.string().required(requiredFieldText).matches(codeRegex),
  name: yup.string().required(requiredFieldText),
  phone: yup
    .string()
    .required(requiredFieldText)
    .matches(phoneRegexName, phoneValidateFailText),
  isActive: yup.bool().required(requiredFieldText),
});

type InstallerFormData = yup.InferType<typeof InstallerFormSchema>;

export function InstallerModal({
  isOpen,
  closeModal,
  installerId,
  installerData,
  onSuccess,
}: Props) {
  const defaultValues = React.useMemo(() => {
    return {
      code: installerData?.code ?? generateInstallerCode(),
      name: installerData?.name,
      phone: installerData?.phone,
      isActive: installerData?.isActive ?? false,
    };
  }, [installerData]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<InstallerFormData>({
    resolver: yupResolver(InstallerFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    reset(defaultValues);

    return () => {
      reset();
    };
  }, [reset, defaultValues]);

  // console.log(watch("orderNumber")); // watch input value by passing the name of it

  const apiClient = useApiClient();
  const onSubmit = React.useCallback(
    async (data: InstallerFormData) => {
      let response: AdminCreateInstaller200Response;

      if (installerId) {
        response = await apiClient.adminUpdateInstaller({
          installerId,
          createUpdateInstaller: data,
        });
      } else {
        response = await apiClient.adminCreateInstaller({
          createUpdateInstaller: data,
        });
      }

      if (response.meta.status === 200) {
        // this sets isDirty back to false
        reset({}, { keepValues: true });
        closeModal();
        onSuccess();
      }
    },
    [apiClient, installerId, closeModal, reset, onSuccess],
  );

  return (
    <Modal isOpen={isOpen} closeModal={closeModal}>
      <ModalHeader>Advanced Settings</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalContent>
          <FormSection>
            <FormField>
              <FormFieldTitle>Code</FormFieldTitle>
              <FormFieldInput
                type="text"
                error={errors.code}
                {...register("code")}
              />
            </FormField>
            <FormField>
              <FormFieldTitle>Name</FormFieldTitle>
              <FormFieldInput
                type="text"
                error={errors.name}
                {...register("name")}
              />
            </FormField>
            <FormField>
              <FormFieldTitle>Phone</FormFieldTitle>
              <FormFieldInput
                type="tel"
                error={errors.phone}
                {...register("phone")}
              />
            </FormField>
            <FormField>
              <FormFieldTitle>Is active</FormFieldTitle>
              <FormSelectInput {...register("isActive")}>
                <option value="true">Yes</option>
                <option value="false">No</option>
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

export type OpenInstallerModal = (args?: {
  installerId?: string;
  data?: Installer;
}) => void;

export const useInstallerModalState = (defaultState?: boolean) => {
  const [installerId, setInstallerId] = React.useState<string | undefined>();
  const [data, setData] = React.useState<Installer | undefined>();
  const [isOpen, setIsOpen] = React.useState(() => {
    return defaultState ?? false;
  });

  const toggleIsOpen = React.useCallback(() => {
    setIsOpen((isOpen) => !isOpen);
  }, []);

  const open = React.useCallback<OpenInstallerModal>(
    ({ installerId, data } = {}) => {
      setIsOpen(true);
      setInstallerId(installerId);
      setData(data);
    },
    [],
  );

  const close = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, toggleIsOpen, open, close, installerId, data };
};
