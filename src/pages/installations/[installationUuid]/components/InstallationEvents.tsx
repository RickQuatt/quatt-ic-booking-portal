import { useCallback, useState, useRef, useLayoutEffect } from "react";
import type { components } from "@/openapi-client/types/api/v1";
import { formatDateTime } from "@/utils/formatDate";
import { Loader } from "@/components/shared/Loader";
import { ErrorText } from "@/components/shared/ErrorText";
import { useInstallationEvents } from "../hooks/useInstallationEvents";
import { getEventTypeEmoji } from "../utils/eventTypeMapping";
import { EventType } from "@/constants/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ScrollIndicatorWrapper } from "@/components/shared/ScrollIndicatorWrapper";

type EventType = components["schemas"]["EventType"];

export interface InstallationEventsProps {
  installationUuid: string;
}

/**
 * Installation Events Component
 * Displays filterable event history with expandable text content
 */
export function InstallationEvents({
  installationUuid,
}: InstallationEventsProps) {
  const [selectedEventType, setSelectedEventType] = useState<
    EventType | undefined
  >(undefined);

  const { events, eventsError, isLoadingEvents, refetchEvents } =
    useInstallationEvents(installationUuid, selectedEventType);
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
    <div className="space-y-4">
      {/* Event Type Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Event Type:
        </label>
        <Select
          value={selectedEventType || "ALL"}
          onValueChange={(value) =>
            setSelectedEventType(
              value === "ALL" ? undefined : (value as EventType),
            )
          }
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">📋 ALL</SelectItem>
            {EventType.values.map((eventType) => (
              <SelectItem key={eventType} value={eventType}>
                {EventType.getEmoji(eventType)} {EventType.getLabel(eventType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      <ScrollIndicatorWrapper axis="y" maxHeight="500px">
        <div className="space-y-3">
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
                      key={event.eventId}
                      className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-dark-foreground ${
                        event.url
                          ? "cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                          : ""
                      }`}
                      onClick={
                        event.url
                          ? () => handleEventClick(event.url)
                          : undefined
                      }
                    >
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {getEventTypeEmoji(event.eventType)} {event.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Created: {formatDateTime(new Date(event.createTime))}
                      </div>
                      {event.closeTime && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Closed: {formatDateTime(new Date(event.closeTime))}
                        </div>
                      )}
                      <div
                        ref={(el) => {
                          if (el) {
                            textRefs.current.set(event.eventId, el);
                          } else {
                            textRefs.current.delete(event.eventId);
                          }
                        }}
                        className={`mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 ${
                          !isExpanded ? "line-clamp-3" : ""
                        }`}
                      >
                        {event.text}
                      </div>
                      {isTruncated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => toggleExpand(event.eventId, e)}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? "Show less event details"
                              : "Show more event details"
                          }
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              {events && events.length === 0 && (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No events 👍
                </div>
              )}
            </>
          )}
        </div>
      </ScrollIndicatorWrapper>
    </div>
  );
}
