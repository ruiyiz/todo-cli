import React from "react";
import { Text } from "ink";
import { formatDateForDisplay, isOverdue } from "@core/utils/date.ts";

export function DateLabel({ dateStr, isCompleted }: { dateStr: string | null; isCompleted: boolean }) {
  if (!dateStr) return null;
  const display = formatDateForDisplay(dateStr);
  const overdue = isOverdue(dateStr) && !isCompleted;
  return <Text color={overdue ? "red" : "cyan"}>{display}</Text>;
}
