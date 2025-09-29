import { useCallback } from "react";
import { formatDateTime } from "../utils/formatDate";
import classes from "./InstallationDetail.module.css";
import { Loader } from "../ui-components/loader/Loader";
import { FormField, FormSection } from "../ui-components/form/Form";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import ErrorText from "../ui-components/error-text/ErrorText";
import { useGetInstallationEvents } from "./hooks/useGetInstallationEvents";
import { getEventTypeEmoji } from "./utils/eventTypeMapping";

interface InstallationDetailEventsProps {
  installationUuid: string;
}

export function InstallationDetailEvents({
  installationUuid,
}: InstallationDetailEventsProps) {
  const { events, eventsError, isLoadingEvents, refetchEvents } =
    useGetInstallationEvents(installationUuid);

  const handleEventClick = useCallback((url: string | null | undefined) => {
    if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  if (eventsError) {
    return (
      <ErrorText
        text="Failed to fetch events for the installation."
        retry={refetchEvents}
      />
    );
  }

  return (
    <div className={classes["detail-section"]}>
      <DetailSectionHeader title="📋 Events" />
      <FormSection>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {isLoadingEvents ? (
              <Loader />
            ) : (
              <>
                {events &&
                  events.map((event) => (
                    <div
                      style={{
                        cursor: event.url ? "pointer" : "default",
                      }}
                      className={classes["event-card"]}
                      key={event.eventId}
                      onClick={() => handleEventClick(event.url)}
                    >
                      <div className={classes["detail-section-bold"]}>
                        {getEventTypeEmoji(event.eventType)} {event.title}
                      </div>
                      <div
                        className={classes["event-date"]}
                      >{`Created: ${formatDateTime(event.createTime)}`}</div>
                      {event.closeTime && (
                        <div
                          className={classes["event-date"]}
                        >{`Closed: ${formatDateTime(event.closeTime)}`}</div>
                      )}
                      <div className={classes["event-text"]}>{event.text}</div>
                    </div>
                  ))}
                {events && events.length === 0 && (
                  <div className={classes["empty-state"]}>No events 👍</div>
                )}
              </>
            )}
          </div>
        </FormField>
      </FormSection>
    </div>
  );
}
