import { useCallback, useState, useRef, useLayoutEffect } from "react";
import { formatDateTime } from "../utils/formatDate";
import classes from "./InstallationDetail.module.css";
import { Loader } from "../ui-components/loader/Loader";
import { FormField, FormSection } from "../ui-components/form/Form";
import { DetailSectionHeader } from "../cic-detail/CICDetailSectionHeader";
import ErrorText from "../ui-components/error-text/ErrorText";
import { useGetInstallationEvents } from "./hooks/useGetInstallationEvents";
import { getEventTypeEmoji, EVENT_TYPE_CONFIG } from "./utils/eventTypeMapping";
import { EventType } from "../api-client/models";
import { Select } from "../ui-components/select/Select";

interface InstallationDetailEventsProps {
  installationUuid: string;
}

export function InstallationDetailEvents({
  installationUuid,
}: InstallationDetailEventsProps) {
  const [selectedEventType, setSelectedEventType] = useState<
    EventType | undefined
  >(undefined);

  const { events, eventsError, isLoadingEvents, refetchEvents } =
    useGetInstallationEvents(installationUuid, selectedEventType);
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(
    new Set(),
  );
  const [truncatedEventIds, setTruncatedEventIds] = useState<Set<string>>(
    new Set(),
  );
  const textRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Measure which events are actually truncated after render
  useLayoutEffect(() => {
    if (!events) return;

    const newTruncatedIds = new Set<string>();
    events.forEach((event) => {
      const element = textRefs.current.get(event.eventId);
      if (element && element.scrollHeight > element.clientHeight) {
        newTruncatedIds.add(event.eventId);
      }
    });
    setTruncatedEventIds(newTruncatedIds);
  }, [events]);

  const handleEventClick = useCallback((url: string | null | undefined) => {
    if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  const handleEventTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setSelectedEventType(value === "" ? undefined : (value as EventType));
    },
    [],
  );

  const toggleExpand = useCallback((eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedEventIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
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
          <div className={classes["event-filter-container"]}>
            <label className={classes["event-filter-label"]}>
              Event Type Filter:
            </label>
            <div className={classes["event-filter-select"]}>
              <Select
                onChange={handleEventTypeChange}
                value={selectedEventType || ""}
              >
                <option value="">ALL</option>
                {EVENT_TYPE_CONFIG.map((config) => (
                  <option key={config.value} value={config.value}>
                    {config.emoji} {config.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </FormField>
        <FormField>
          <div className={classes["detail-section-api-cards"]}>
            {isLoadingEvents ? (
              <Loader />
            ) : (
              <>
                {events &&
                  events.map((event) => {
                    const isExpanded = expandedEventIds.has(event.eventId);
                    const isTruncated = truncatedEventIds.has(event.eventId);

                    return (
                      <div
                        style={{
                          cursor: event.url ? "pointer" : "default",
                        }}
                        className={classes["event-card"]}
                        key={event.eventId}
                        onClick={
                          event.url
                            ? () => handleEventClick(event.url)
                            : undefined
                        }
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
                        <div
                          ref={(el) => {
                            if (el) {
                              textRefs.current.set(event.eventId, el);
                            } else {
                              textRefs.current.delete(event.eventId);
                            }
                          }}
                          className={`${classes["event-text"]} ${
                            !isExpanded
                              ? classes["event-text-truncated"]
                              : classes["event-text-expanded"]
                          }`}
                        >
                          {event.text}
                        </div>
                        {isTruncated && (
                          <button
                            className={classes["event-expand-button"]}
                            onClick={(e) => toggleExpand(event.eventId, e)}
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? "Show less event details"
                                : "Show more event details"
                            }
                          >
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    );
                  })}
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
