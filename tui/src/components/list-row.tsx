import React from "react";
import { Box, Text } from "ink";
import type { ListWithCount } from "@core/models/list.ts";

interface Props {
  list: ListWithCount;
  isSelected: boolean;
}

export function ListRow({ list, isSelected }: Props) {
  const active = list.todo_count - list.completed_count;
  return (
    <Box>
      <Text color="yellow">{isSelected ? "❯" : " "}</Text>
      <Text> </Text>
      <Text dimColor>{String(list.logical_id).padStart(2)}</Text>
      <Text>  </Text>
      <Text bold>{list.title}</Text>
      <Text> </Text>
      <Text dimColor>({active} active, {list.completed_count} done)</Text>
    </Box>
  );
}
