import type { components } from "@/openapi-client/types/api/v1";
import { EventType } from "@/constants/enums";

type EventTypeValue = components["schemas"]["EventType"];

/**
 * Utility function to map event types to corresponding emojis for events in the installation detail view.
 */
export const getEventTypeEmoji = (eventType: EventTypeValue): string => {
  return EventType.getEmoji(eventType) ?? "📋";
};

/**
 * Utility function to get the label for an event type.
 */
export const getEventTypeLabel = (eventType: EventTypeValue): string => {
  return EventType.getLabel(eventType);
};
