import React from "react";
import { Box, Text } from "ink";
import { PriorityBadge } from "./priority-badge.tsx";
import { DateLabel } from "./date-label.tsx";
import type { TodoWithList } from "@core/models/todo.ts";
import { theme } from "../theme.ts";

interface Props {
  todo: TodoWithList;
  isSelected: boolean;
}

export function TodoRow({ todo, isSelected }: Props) {
  const check = todo.is_completed ? "✓" : "○";
  const checkColor = todo.is_completed ? theme.success : undefined;
  const completed = !!todo.is_completed;

  return (
    <Box>
      <Text color={theme.selection}>{isSelected ? "❯" : " "}</Text>
      <Text> </Text>
      <Text color={checkColor} dimColor={!todo.is_completed}>{check}</Text>
      <Text> </Text>
      <Text dimColor>{todo.list_title.slice(0, 15).padEnd(15)}</Text>
      <Text> </Text>
      {completed ? (
        <Text dimColor strikethrough>{todo.title}</Text>
      ) : (
        <Text bold>{todo.title}</Text>
      )}
      {todo.due_date && (
        <>
          <Text> </Text>
          <DateLabel dateStr={todo.due_date} isCompleted={completed} />
        </>
      )}
      {todo.priority === "prioritized" && (
        <>
          <Text> </Text>
          <PriorityBadge priority={todo.priority} />
        </>
      )}
    </Box>
  );
}
