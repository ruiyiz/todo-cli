export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeekday(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return new Date(value + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

export function shiftDate(value: string, delta: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return localDateStr(today);
  }
  const d = new Date(value + "T00:00:00");
  d.setDate(d.getDate() + delta);
  if (d < today) return localDateStr(today);
  return localDateStr(d);
}
