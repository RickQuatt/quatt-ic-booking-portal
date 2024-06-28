import React from "react";

import * as yup from "yup";
import { Note } from "../api-client/models/Note";
import {
  FormField,
  FormFieldTextarea,
  FormSection,
} from "../ui-components/form/Form";
import {
  Modal,
  ModalActions,
  ModalConfirmButton,
  ModalContent,
  ModalDeleteButton,
  ModalHeader,
  ModalProps,
} from "../ui-components/modal/Modal";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useApiClient } from "../api-client/context";
import { AdminAddInstallationNote200Response } from "../api-client/models";

interface Props extends ModalProps {
  noteData: Note | null;
  installationId: string;
  onSuccess: () => void;
}

const NoteFormSchema = yup.object({
  note: yup.string().required(),
});

type NoteFormData = yup.InferType<typeof NoteFormSchema>;

export function NotesModal({
  isOpen,
  closeModal,
  noteData,
  installationId,
  onSuccess,
}: Props) {
  const defaultValues: NoteFormData = React.useMemo(() => {
    return {
      note: noteData?.note || "",
    };
  }, [noteData]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: yupResolver(NoteFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    reset(defaultValues);

    return () => {
      reset();
    };
  }, [reset, defaultValues]);

  const apiClient = useApiClient();
  const onSubmit = React.useCallback(
    async (data: NoteFormData) => {
      let response: AdminAddInstallationNote200Response;

      if (noteData) {
        response = await apiClient.adminUpdateInstallationNote({
          installationId,
          noteId: noteData.id,
          createUpdateNote: {
            note: data.note,
          },
        });
      } else {
        response = await apiClient.adminAddInstallationNote({
          installationId,
          createUpdateNote: {
            note: data.note,
          },
        });
      }
      if (response.meta.status === 200) {
        reset({}, { keepValues: true });
        closeModal();
        onSuccess();
      }
    },
    [apiClient, closeModal, reset, noteData, installationId, onSuccess],
  );

  const onDelete = React.useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you would like to delete this note? This action cannot be undone.",
      )
    ) {
      return;
    }

    if (!noteData) {
      return;
    }

    await apiClient.adminDeleteInstallationNote({
      installationId,
      noteId: noteData.id,
    });

    reset({}, { keepValues: true });
    closeModal();
    onSuccess();
  }, [apiClient, closeModal, noteData, installationId, onSuccess, reset]);

  return (
    <Modal isOpen={isOpen} closeModal={closeModal}>
      <ModalHeader closeModal={closeModal}>✏️ Note</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalContent>
          <FormSection>
            <FormField>
              <FormFieldTextarea
                placeholder="Write down a note..."
                error={errors.note}
                {...register("note")}
              />
            </FormField>
          </FormSection>
        </ModalContent>
        <ModalActions>
          {noteData && (
            <ModalDeleteButton color="danger" onClick={onDelete}>
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
