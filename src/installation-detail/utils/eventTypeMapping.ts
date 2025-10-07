import { EventType } from "../../api-client/models";

interface EventTypeConfig {
  value: EventType;
  emoji: string;
  label: string;
}

// Centralized configuration for event types with emojis and labels
export const EVENT_TYPE_CONFIG: EventTypeConfig[] = [
  { value: EventType.Email, emoji: "📧", label: "Email" },
  { value: EventType.SettingChange, emoji: "⚙️", label: "Setting Change" },
  { value: EventType.HubspotTicket, emoji: "🎫", label: "Hubspot Ticket" },
  { value: EventType.Note, emoji: "📝", label: "Note" },
  { value: EventType.Job, emoji: "🔧", label: "Job" },
  { value: EventType.Skedulo, emoji: "📅", label: "Skedulo" },
  { value: EventType.ZendeskTicket, emoji: "🎟️", label: "Zendesk Ticket" },
];

const eventTypeToEmoji = EVENT_TYPE_CONFIG.reduce(
  (acc, config) => {
    acc[config.value] = config.emoji;
    return acc;
  },
  {} as Record<EventType, string>,
);

// Utility function to map event types to corresponding emojis for events in the installation detail view.
export const getEventTypeEmoji = (eventType: EventType): string => {
  return eventTypeToEmoji[eventType] ?? "📋";
};
