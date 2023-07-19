import { formatDistance } from "date-fns";

// as in 2023-05-23
export function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

// as in "x minutes ago"
export function formatDateDistance(date: Date | null) {
  if (!date) return null;
  return formatDistance(date, new Date(), { addSuffix: true });
}
