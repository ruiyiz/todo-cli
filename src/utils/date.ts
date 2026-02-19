import * as chrono from "chrono-node";

export function parseDate(input: string): Date | null {
  const results = chrono.parseDate(input);
  return results;
}

function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateForDb(date: Date): string {
  return localDateStr(date);
}

export function todayStr(): string {
  return localDateStr(new Date());
}

export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localDateStr(d);
}

export function weekEndStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return localDateStr(d);
}

export function endOfWeekStr(): string {
  const d = new Date();
  const daysUntilSunday = d.getDay() === 0 ? 0 : 7 - d.getDay();
  d.setDate(d.getDate() + daysUntilSunday);
  return localDateStr(d);
}

export function plus10DaysStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  return localDateStr(d);
}

export function formatDateForDisplay(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 1 && diffDays <= 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return dateStr;
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr < todayStr();
}
