import React from "react";
import { Box } from "ink";
import { TodoRow } from "./todo-row.tsx";
import type { TodoWithList } from "@core/models/todo.ts";

interface Props {
  todos: TodoWithList[];
  cursorIndex: number;
  maxVisible?: number;
}

export function TodoList({ todos, cursorIndex, maxVisible = 20 }: Props) {
  const start = Math.max(0, Math.min(cursorIndex - Math.floor(maxVisible / 2), todos.length - maxVisible));
  const visible = todos.slice(Math.max(0, start), Math.max(0, start) + maxVisible);
  const offset = Math.max(0, start);

  return (
    <Box flexDirection="column">
      {visible.map((todo, i) => (
        <TodoRow key={todo.id} todo={todo} isSelected={offset + i === cursorIndex} />
      ))}
    </Box>
  );
}
