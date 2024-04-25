import { formatDistance, format } from "date-fns";

// as in 2023-05-23
export function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toISOString().split("T")[0];
}

// as in 05 Apr 2024
export function formatDateShortAsString(date: Date | null) {
  if (!date) return null;
  return format(date, "dd MMM yyyy");
}

export function formatAsDate(date: Date | null) {
  if (!date) return null;
  return new Date(format(date, "yyyy-MM-dd"));
}

export function formatDateTime(date: Date | null) {
  if (!date) return null;
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

export function formatDateTimeString(date: string | null) {
  if (!date) return null;
  return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
}

// as in "x minutes ago"
export function formatDateDistance(date: Date | null) {
  if (!date) return null;
  return formatDistance(date, new Date(), { addSuffix: true });
}
