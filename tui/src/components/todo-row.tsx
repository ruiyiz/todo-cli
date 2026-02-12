import React from "react";
import { Box, Text, useStdout } from "ink";
import { PriorityBadge } from "./priority-badge.tsx";
import { DateLabel } from "./date-label.tsx";
import { formatDateForDisplay } from "@core/utils/date.ts";
import type { TodoWithList } from "@core/models/todo.ts";
import { theme } from "../theme.ts";

interface Props {
  todo: TodoWithList;
  isSelected: boolean;
  isMarked?: boolean;
  showList?: boolean;
}

export function TodoRow({ todo, isSelected, isMarked, showList = true }: Props) {
  const { stdout } = useStdout();
  const cols = (stdout.columns ?? 80) - 1;
  const completed = !!todo.is_completed;
  const check = completed ? "✓" : isMarked ? "◉" : "○";
  const checkColor = isMarked ? theme.accent : completed ? theme.success : undefined;

  // prefix: "❯ ○ " = 4, plus optionally list(15) + space(1) = 16
  const prefix = showList ? 4 + 16 : 4;
  let suffix = 0;
  if (todo.due_date) suffix += 1 + formatDateForDisplay(todo.due_date).length;
  if (todo.priority === "prioritized") suffix += 2;
  const maxTitle = Math.max(4, cols - prefix - suffix);
  const title = todo.title.length > maxTitle
    ? todo.title.slice(0, maxTitle - 1) + "…"
    : todo.title;

  return (
    <Box>
      <Text color={theme.selection}>{isSelected ? "❯" : " "}</Text>
      <Text> </Text>
      <Text color={checkColor} dimColor={!isMarked && !completed}>{check}</Text>
      <Text> </Text>
      {showList && (
        <>
          <Text dimColor>{todo.list_title.slice(0, 15).padEnd(15)}</Text>
          <Text> </Text>
        </>
      )}
      {completed ? (
        <Text dimColor strikethrough>{title}</Text>
      ) : (
        <Text bold>{title}</Text>
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
