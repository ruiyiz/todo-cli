import React from "react";
import { Text } from "ink";

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority !== "prioritized") return null;
  return <Text color="yellow">★</Text>;
}
