import React, { useState, useCallback } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { useAppState } from "../context.ts";
import { useSearch } from "../hooks/use-search.ts";
import { TodoRow } from "./todo-row.tsx";
import { InlineInput } from "./inline-input.tsx";
import { ConfirmDialog } from "./confirm-dialog.tsx";
import {
  completeTodo,
  updateTodo,
  deleteTodo,
} from "@core/db/repository.ts";
import { parseDate, formatDateForDb } from "@core/utils/date.ts";
import type { Priority } from "@core/types.ts";
import { theme } from "../theme.ts";

type SubModal = "none" | "setDue" | "confirmDelete";

interface Props {
  listId: string | null;
  listTitle: string | null;
  onClose: () => void;
  onOpen: (todoId: string, listId: string) => void;
}

export function SearchOverlay({ listId, listTitle, onClose, onOpen }: Props) {
  const { dispatch } = useAppState();
  const { stdout } = useStdout();
  const { results, query, setQuery } = useSearch(listId);
  const [cursor, setCursor] = useState(0);
  const [subModal, setSubModal] = useState<SubModal>("none");

  const clampedCursor = Math.min(cursor, Math.max(0, results.length - 1));
  const currentTodo = results[clampedCursor];

  const visibleRows = (stdout.rows ?? 24) - 8;
  const half = Math.floor(visibleRows / 2);
  let scrollTop = clampedCursor - half;
  scrollTop = Math.max(0, Math.min(scrollTop, Math.max(0, results.length - visibleRows)));
  const visibleResults = results.slice(scrollTop, scrollTop + visibleRows);
  const showList = !listId;

  const handleSetDue = useCallback((value: string) => {
    if (currentTodo) {
      const trimmed = value.trim();
      if (trimmed === "") {
        updateTodo(currentTodo.id, { due_date: null });
      } else {
        const parsed = parseDate(trimmed);
        if (parsed) updateTodo(currentTodo.id, { due_date: formatDateForDb(parsed) });
      }
      dispatch({ type: "REFRESH" });
    }
    setSubModal("none");
  }, [currentTodo, dispatch]);

  const handleConfirmDelete = useCallback(() => {
    if (currentTodo) {
      deleteTodo(currentTodo.id);
      dispatch({ type: "REFRESH" });
    }
    setSubModal("none");
  }, [currentTodo, dispatch]);

  useInput((input, key) => {
    if (subModal !== "none") return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.return && currentTodo) {
      onOpen(currentTodo.id, currentTodo.list_id);
      return;
    }

    if (key.downArrow) {
      setCursor((c) => Math.min(c + 1, results.length - 1));
      return;
    }
    if (key.upArrow) {
      setCursor((c) => Math.max(c - 1, 0));
      return;
    }

    if (key.backspace || key.delete) {
      setQuery((prev) => {
        const next = prev.slice(0, -1);
        setCursor(0);
        return next;
      });
      return;
    }

    // Ctrl+key quick actions (control char codes: ^X=0x18, ^P=0x10, ^S=0x13, ^D=0x04)
    const code = input.length === 1 ? input.charCodeAt(0) : -1;
    if (code === 0x18 && currentTodo) {
      if (currentTodo.is_completed) {
        updateTodo(currentTodo.id, { is_completed: 0, completed_at: null });
      } else {
        completeTodo(currentTodo.id);
      }
      dispatch({ type: "REFRESH" });
      return;
    }
    if (code === 0x10 && currentTodo) {
      const next: Priority = currentTodo.priority === "prioritized" ? "normal" : "prioritized";
      updateTodo(currentTodo.id, { priority: next });
      dispatch({ type: "REFRESH" });
      return;
    }
    if (code === 0x13 && currentTodo) {
      setSubModal("setDue");
      return;
    }
    if (code === 0x04 && currentTodo) {
      setSubModal("confirmDelete");
      return;
    }

    // All printable characters go to query
    if (input && code >= 32 && !key.ctrl && !key.meta && !key.tab) {
      setQuery((prev) => {
        setCursor(0);
        return prev + input;
      });
    }
  });

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.accent} paddingX={1} flexGrow={1}>
      <Box>
        <Text bold color={theme.accent}>Search</Text>
        {listTitle && (
          <Text dimColor> (in {listTitle})</Text>
        )}
      </Box>
      <Box>
        <Text color={theme.selection}>&gt; </Text>
        <Text>{query}<Text inverse> </Text></Text>
      </Box>
      <Box borderStyle="single" borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} borderColor="gray" />

      {subModal === "setDue" && currentTodo && (
        <InlineInput
          label="Due date"
          initialValue={currentTodo.due_date ?? ""}
          onSubmit={handleSetDue}
          onCancel={() => setSubModal("none")}
        />
      )}
      {subModal === "confirmDelete" && currentTodo && (
        <ConfirmDialog
          message={`Delete "${currentTodo.title}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setSubModal("none")}
        />
      )}

      {results.length === 0 ? (
        <Text dimColor>{query ? "No matches" : "No todos"}</Text>
      ) : (
        visibleResults.map((todo, i) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            isSelected={scrollTop + i === clampedCursor}
            showList={showList}
            inset={4}
          />
        ))
      )}

      <Text dimColor>
        {results.length} result{results.length !== 1 ? "s" : ""}
      </Text>
    </Box>
  );
}
