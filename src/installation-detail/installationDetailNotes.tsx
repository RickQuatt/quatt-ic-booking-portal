import React from "react";
import { useQuery } from "@tanstack/react-query";

import { NotesModal } from "./NoteModal";
import { Note } from "../api-client/models/Note";
import { useApiClient } from "../api-client/context";
import classes from "./InstallationDetail.module.css";
import { Loader } from "../ui-components/loader/Loader";
import { FormField, FormSection } from "../ui-components/form/Form";
import { useModalState } from "../ui-components/modal/useModalState";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { formatDateTime } from "../utils/formatDate";
import ErrorText from "../ui-components/error-text/ErrorText";

export function InstallationDetailNotes({
  installationId,
}: {
  installationId: string;
}) {
  const apiClient = useApiClient();
  const [noteData, setNoteData] = React.useState<Note | null>(null);
  const {
    isOpen: isNoteModalOpen,
    open: openNoteModal,
    close: closeNoteModal,
  } = useModalState();

  const createNewNote = () => {
    setNoteData(null);
    openNoteModal();
  };

  const {
    data: notesData,
    isPending,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["installationNotes", installationId],
    queryFn: () =>
      apiClient.adminGetInstallationNotes({
        installationId,
      }),
  });
  const notes = notesData?.result;

  const handleNoteClick = (note: Note) => {
    setNoteData(note);
    openNoteModal();
  };

  if (isPending) {
    return <Loader />;
  }

  if (isError) {
    return (
      <ErrorText
        text="Failed to fetch notes for the installation."
        retry={refetch}
      />
    );
  }

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="📝 Notes" onClick={createNewNote} />
      <NotesModal
        isOpen={isNoteModalOpen}
        closeModal={closeNoteModal}
        noteData={noteData}
        installationId={installationId}
        onSuccess={refetch}
      />
      <FormSection>
        <div className={classes["detail-section-api-cards"]}>
          {notes &&
            notes.map((note) => (
              <div
                style={{ cursor: "pointer", flex: 1 }}
                className={classes["detail-section"]}
                key={note.id}
                onClick={() => handleNoteClick(note)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span className={classes["detail-section-bold"]}>
                    👤 {note.updatedBy}
                  </span>
                  <span style={{ fontStyle: "italic" }}>
                    {formatDateTime(note.createdAt ?? null)}
                  </span>
                </div>
                <span>{note.note}</span>
              </div>
            ))}
          {notes && notes.length === 0 && (
            <span style={{ margin: "auto" }}>No notes 👍</span>
          )}
        </div>
      </FormSection>
    </div>
  );
}
