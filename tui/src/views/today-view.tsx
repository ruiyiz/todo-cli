import React, { useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useAppState } from "../context.ts";
import { useTodayData } from "../hooks/use-today.ts";
import { TodoRow } from "../components/todo-row.tsx";
import { SectionHeader } from "../components/section-header.tsx";
import { ConfirmDialog } from "../components/confirm-dialog.tsx";
import { InlineInput } from "../components/inline-input.tsx";
import { completeTodo, updateTodo, deleteTodo, createTodo, getAllLists } from "@core/db/repository.ts";
import { parseDate, formatDateForDb, todayStr, tomorrowStr } from "@core/utils/date.ts";
import type { TodoWithList } from "@core/models/todo.ts";
import type { Priority } from "@core/types.ts";
import { randomUUID } from "crypto";

export function TodayView() {
  const { state, dispatch } = useAppState();
  const { overdue, dueToday, upcoming, highPriority, all } = useTodayData();

  const clampCursor = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, all.length - 1)),
    [all.length]
  );

  const currentTodo: TodoWithList | undefined = all[state.cursorIndex];

  useInput((input, key) => {
    if (state.modal !== "none") return;

    if (input === "j" || key.downArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex + 1) });
    } else if (input === "k" || key.upArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex - 1) });
    } else if (input === "g") {
      dispatch({ type: "SET_CURSOR", index: 0 });
    } else if (input === "G") {
      dispatch({ type: "SET_CURSOR", index: clampCursor(all.length - 1) });
    } else if (key.return && currentTodo) {
      dispatch({ type: "PUSH_VIEW", view: "todoDetail", todoId: currentTodo.id });
    } else if ((input === "x" || input === " ") && currentTodo) {
      if (currentTodo.is_completed) {
        updateTodo(currentTodo.id, { is_completed: 0, completed_at: null });
      } else {
        completeTodo(currentTodo.id);
      }
      dispatch({ type: "REFRESH" });
    } else if (input === "p" && currentTodo) {
      const next: Priority = currentTodo.priority === "prioritized" ? "normal" : "prioritized";
      updateTodo(currentTodo.id, { priority: next });
      dispatch({ type: "REFRESH" });
    } else if (input === "s" && currentTodo) {
      dispatch({ type: "OPEN_MODAL", modal: "setDue" });
    } else if (input === "t" && currentTodo) {
      updateTodo(currentTodo.id, { due_date: todayStr() });
      dispatch({ type: "REFRESH" });
    } else if (input === "T" && currentTodo) {
      updateTodo(currentTodo.id, { due_date: tomorrowStr() });
      dispatch({ type: "REFRESH" });
    } else if (input === "d" && currentTodo) {
      dispatch({ type: "OPEN_MODAL", modal: "confirmDelete" });
    } else if (input === "a") {
      dispatch({ type: "OPEN_MODAL", modal: "quickAdd" });
    }
  });

  const handleQuickAdd = useCallback((value: string) => {
    const title = value.trim();
    if (title) {
      const lists = getAllLists();
      const listId = lists[0]?.id;
      if (listId) {
        createTodo({
          id: randomUUID(),
          title,
          list_id: listId,
          due_date: todayStr(),
        });
        dispatch({ type: "REFRESH" });
      }
    }
    dispatch({ type: "CLOSE_MODAL" });
  }, [dispatch]);

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
    dispatch({ type: "CLOSE_MODAL" });
  }, [currentTodo, dispatch]);

  const handleConfirmDelete = useCallback(() => {
    if (currentTodo) {
      deleteTodo(currentTodo.id);
      dispatch({ type: "CLOSE_MODAL" });
      dispatch({ type: "REFRESH" });
      if (state.cursorIndex >= all.length - 1) {
        dispatch({ type: "SET_CURSOR", index: Math.max(0, all.length - 2) });
      }
    }
  }, [currentTodo, all.length, state.cursorIndex, dispatch]);

  let globalIdx = 0;
  const sections: { label: string; color?: string; todos: TodoWithList[]; startIdx: number }[] = [];

  if (overdue.length > 0) {
    sections.push({ label: "Overdue", color: "red", todos: overdue, startIdx: globalIdx });
    globalIdx += overdue.length;
  }
  if (dueToday.length > 0) {
    sections.push({ label: "Due today", todos: dueToday, startIdx: globalIdx });
    globalIdx += dueToday.length;
  }
  if (upcoming.length > 0) {
    sections.push({ label: "Upcoming (7 days)", color: "cyan", todos: upcoming, startIdx: globalIdx });
    globalIdx += upcoming.length;
  }
  if (highPriority.length > 0) {
    sections.push({ label: "Prioritized", color: "yellow", todos: highPriority, startIdx: globalIdx });
    globalIdx += highPriority.length;
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {state.modal === "quickAdd" && (
        <InlineInput
          label="Quick add (due today)"
          onSubmit={handleQuickAdd}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {state.modal === "confirmDelete" && currentTodo && (
        <ConfirmDialog
          message={`Delete "${currentTodo.title}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {state.modal === "setDue" && currentTodo && (
        <InlineInput
          label="Due date"
          initialValue={currentTodo.due_date ?? ""}
          onSubmit={handleSetDue}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {all.length === 0 && state.modal !== "quickAdd" ? (
        <Box paddingY={1}>
          <Text dimColor>Nothing for today. Press 'a' to add a todo.</Text>
        </Box>
      ) : (
        sections.map((section) => (
          <Box key={section.label} flexDirection="column">
            <SectionHeader label={section.label} count={section.todos.length} color={section.color} />
            {section.todos.map((todo, i) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                isSelected={section.startIdx + i === state.cursorIndex}
              />
            ))}
          </Box>
        ))
      )}
    </Box>
  );
}
