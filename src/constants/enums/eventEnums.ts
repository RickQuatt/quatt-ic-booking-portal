import type { components } from "@/openapi-client/types/api/v1";
import { createEnumMeta } from "./helpers";

export const EventType = createEnumMeta<components["schemas"]["EventType"]>({
  EVENT_EMAIL: { label: "Email", emoji: "📧" },
  EVENT_SETTING_CHANGE: { label: "Setting Change", emoji: "⚙️" },
  EVENT_HUBSPOT_TICKET: { label: "Hubspot Ticket", emoji: "🎫" },
  EVENT_NOTE: { label: "Note", emoji: "📝" },
  EVENT_JOB: { label: "Job", emoji: "🔧" },
  EVENT_SKEDULO: { label: "Skedulo", emoji: "📅" },
  EVENT_ZENDESK_TICKET: { label: "Zendesk Ticket", emoji: "🎟️" },
});
