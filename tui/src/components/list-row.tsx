import React from "react";
import { Box, Text, useStdout } from "ink";
import type { ListWithCount } from "@core/models/list.ts";
import { theme } from "../theme.ts";

interface Props {
  list: ListWithCount;
  isSelected: boolean;
}

export function ListRow({ list, isSelected }: Props) {
  const { stdout } = useStdout();
  const cols = (stdout.columns ?? 80) - 1;
  const active = list.todo_count - list.completed_count;
  const stats = `(${active} active, ${list.completed_count} done)`;
  // prefix: "❯ " + id(2) + "  " = 6; suffix: " " + stats
  const maxTitle = Math.max(4, cols - 6 - 1 - stats.length);
  const title = list.title.length > maxTitle
    ? list.title.slice(0, maxTitle - 1) + "…"
    : list.title;

  return (
    <Box>
      <Text color={theme.selection}>{isSelected ? "❯" : " "}</Text>
      <Text> </Text>
      <Text dimColor>{String(list.logical_id).padStart(2)}</Text>
      <Text>  </Text>
      <Text bold>{title}</Text>
      <Text> </Text>
      <Text dimColor>{stats}</Text>
    </Box>
  );
}
