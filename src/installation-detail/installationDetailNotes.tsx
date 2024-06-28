import React from "react";
import { useQuery } from "react-query";

import { NotesModal } from "./NoteModal";
import { Note } from "../api-client/models/Note";
import { useApiClient } from "../api-client/context";
import classes from "./InstallationDetail.module.css";
import { Loader } from "../ui-components/loader/Loader";
import { FormField, FormSection } from "../ui-components/form/Form";
import { useModalState } from "../ui-components/modal/useModalState";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import { formatDateTime } from "../utils/formatDate";

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
    status: notesStatus,
    refetch,
  } = useQuery(["installationNotes", installationId], () => {
    return apiClient.adminGetInstallationNotes({
      installationId,
    });
  });
  const notes = notesData?.result;

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader
        title="📝 Notes"
        onClick={() => {
          createNewNote();
        }}
      />
      <NotesModal
        isOpen={isNoteModalOpen}
        closeModal={closeNoteModal}
        noteData={noteData}
        installationId={installationId}
        onSuccess={refetch}
      />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {notesStatus === "loading" ? (
              <Loader />
            ) : (
              <>
                {notes &&
                  notes.map((note) => (
                    <div
                      style={{ cursor: "pointer" }}
                      className={classes["detail-section"]}
                      key={note.id}
                      onClick={() => {
                        setNoteData(note);
                        openNoteModal();
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <div className={classes["detail-section-bold"]}>
                          👤 {note.updatedBy}
                        </div>
                        <div style={{ fontStyle: "italic" }}>
                          {formatDateTime(note.createdAt ?? null)}
                        </div>
                      </div>
                      <div>{note.note}</div>
                    </div>
                  ))}
              </>
            )}
            {notes && notes.length === 0 && (
              <div style={{ textAlign: "center" }}>No notes 👍</div>
            )}
          </div>
        </FormField>
      </FormSection>
    </div>
  );
}
