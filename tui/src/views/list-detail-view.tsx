import React, { useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useAppState } from "../context.ts";
import { useListTodos, useListTitle } from "../hooks/use-data.ts";
import { TodoRow } from "../components/todo-row.tsx";
import { ConfirmDialog } from "../components/confirm-dialog.tsx";
import { InputForm } from "../components/input-form.tsx";
import { InlineInput } from "../components/inline-input.tsx";
import {
  completeTodo,
  updateTodo,
  deleteTodo,
  createTodo,
} from "@core/db/repository.ts";
import { parseDate, formatDateForDb, todayStr, tomorrowStr } from "@core/utils/date.ts";
import type { Priority } from "@core/types.ts";
import type { TodoWithList } from "@core/models/todo.ts";
import { randomUUID } from "crypto";


export function ListDetailView() {
  const { state, dispatch } = useAppState();
  const todos = useListTodos();
  const listTitle = useListTitle();

  const clampCursor = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, todos.length - 1)),
    [todos.length]
  );

  const currentTodo: TodoWithList | undefined = todos[state.cursorIndex];

  useInput((input, key) => {
    if (state.modal !== "none") return;
    if (key.escape) return;

    if (input === "j" || key.downArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex + 1) });
    } else if (input === "k" || key.upArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex - 1) });
    } else if (input === "g") {
      dispatch({ type: "SET_CURSOR", index: 0 });
    } else if (input === "G") {
      dispatch({ type: "SET_CURSOR", index: clampCursor(todos.length - 1) });
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
    } else if (input === "a") {
      dispatch({ type: "OPEN_MODAL", modal: "addTodo" });
    } else if (input === "e" && currentTodo) {
      dispatch({ type: "OPEN_MODAL", modal: "editTodo" });
    } else if (input === "d" && currentTodo) {
      dispatch({ type: "OPEN_MODAL", modal: "confirmDelete" });
    } else if (input === "f") {
      dispatch({ type: "CYCLE_FILTER" });
    }
  });

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

  const handleAddTodo = useCallback((values: Record<string, string>) => {
    const title = values.title?.trim();
    if (title && state.selectedListId) {
      let dueDate: string | null = null;
      if (values.due?.trim()) {
        const parsed = parseDate(values.due.trim());
        if (parsed) dueDate = formatDateForDb(parsed);
      }
      createTodo({
        id: randomUUID(),
        title,
        list_id: state.selectedListId,
        due_date: dueDate,
        priority: (values.priority as Priority) || "normal",
        notes: values.notes?.trim() || null,
      });
      dispatch({ type: "REFRESH" });
    }
    dispatch({ type: "CLOSE_MODAL" });
  }, [state.selectedListId, dispatch]);

  const handleEditTodo = useCallback((values: Record<string, string>) => {
    if (!currentTodo) return;
    const updates: Record<string, any> = {};
    const title = values.title?.trim();
    if (title && title !== currentTodo.title) updates.title = title;

    if (values.due !== undefined) {
      const dueTrimmed = values.due.trim();
      if (dueTrimmed === "" && currentTodo.due_date) {
        updates.due_date = null;
      } else if (dueTrimmed) {
        const parsed = parseDate(dueTrimmed);
        if (parsed) updates.due_date = formatDateForDb(parsed);
      }
    }

    if (values.priority && values.priority !== currentTodo.priority) {
      updates.priority = values.priority;
    }
    if (values.notes !== undefined) {
      const notesTrimmed = values.notes.trim();
      updates.notes = notesTrimmed || null;
    }

    if (Object.keys(updates).length > 0) {
      updateTodo(currentTodo.id, updates);
      dispatch({ type: "REFRESH" });
    }
    dispatch({ type: "CLOSE_MODAL" });
  }, [currentTodo, dispatch]);

  const handleConfirmDelete = useCallback(() => {
    if (currentTodo) {
      deleteTodo(currentTodo.id);
      dispatch({ type: "CLOSE_MODAL" });
      dispatch({ type: "REFRESH" });
      if (state.cursorIndex >= todos.length - 1) {
        dispatch({ type: "SET_CURSOR", index: Math.max(0, todos.length - 2) });
      }
    }
  }, [currentTodo, todos.length, state.cursorIndex, dispatch]);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold>{listTitle}</Text>
        <Text> </Text>
        <Text dimColor>[{state.listFilter}]</Text>
      </Box>

      {state.modal === "addTodo" && (
        <InputForm
          title="New Todo"
          fields={[
            { name: "title", label: "Title", value: "" },
            { name: "due", label: "Due date", value: "" },
            { name: "priority", label: "Priority", value: "normal", type: "priority" },
            { name: "notes", label: "Notes", value: "" },
          ]}
          onSubmit={handleAddTodo}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {state.modal === "editTodo" && currentTodo && (
        <InputForm
          title="Edit Todo"
          fields={[
            { name: "title", label: "Title", value: currentTodo.title },
            { name: "due", label: "Due date", value: currentTodo.due_date ?? "" },
            { name: "priority", label: "Priority", value: currentTodo.priority, type: "priority" },
            { name: "notes", label: "Notes", value: currentTodo.notes ?? "" },
          ]}
          onSubmit={handleEditTodo}
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
      {state.modal === "confirmDelete" && currentTodo && (
        <ConfirmDialog
          message={`Delete "${currentTodo.title}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}

      {todos.length === 0 ? (
        <Text dimColor>No todos. Press 'a' to add one.</Text>
      ) : (
        todos.map((todo, i) => (
          <TodoRow key={todo.id} todo={todo} isSelected={i === state.cursorIndex} />
        ))
      )}
    </Box>
  );
}
