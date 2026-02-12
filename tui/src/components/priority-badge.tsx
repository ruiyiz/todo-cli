import React from "react";
import { Text } from "ink";
import { theme } from "../theme.ts";

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority !== "prioritized") return null;
  return <Text color={theme.priority}>★</Text>;
}
