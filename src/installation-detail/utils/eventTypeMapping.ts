// Utility function to map event types to corresponding emojis for events in the installation detail view.
export const getEventTypeEmoji = (eventType: string): string => {
  const eventTypeToEmoji: Record<string, string> = {
    "Hubspot ticket": "🎫",
    Note: "📝",
    "Setting change": "⚙️",
    "Zendesk ticket": "🎟️",
    Job: "🔧",
    Email: "📧",
  };

  return eventTypeToEmoji[eventType] || "📋";
};
