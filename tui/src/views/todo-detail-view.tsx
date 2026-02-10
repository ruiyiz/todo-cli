import React, { useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useAppState } from "../context.ts";
import { useTodoDetail } from "../hooks/use-data.ts";
import { DateLabel } from "../components/date-label.tsx";
import { InlineInput } from "../components/inline-input.tsx";
import { ConfirmDialog } from "../components/confirm-dialog.tsx";
import { InputForm } from "../components/input-form.tsx";
import {
  completeTodo,
  updateTodo,
  deleteTodo,
} from "@core/db/repository.ts";
import { parseDate, formatDateForDb } from "@core/utils/date.ts";
import type { Priority } from "@core/types.ts";

export function TodoDetailView() {
  const { state, dispatch } = useAppState();
  const todo = useTodoDetail();

  useInput((input, key) => {
    if (state.modal !== "none") return;
    if (key.escape) return;
    if (!todo) return;

    if (input === "x" || input === " ") {
      if (todo.is_completed) {
        updateTodo(todo.id, { is_completed: 0, completed_at: null });
      } else {
        completeTodo(todo.id);
      }
      dispatch({ type: "REFRESH" });
    } else if (input === "p") {
      const next: Priority = todo.priority === "prioritized" ? "normal" : "prioritized";
      updateTodo(todo.id, { priority: next });
      dispatch({ type: "REFRESH" });
    } else if (input === "s") {
      dispatch({ type: "OPEN_MODAL", modal: "setDue" });
    } else if (input === "e") {
      dispatch({ type: "OPEN_MODAL", modal: "editTodo" });
    } else if (input === "d") {
      dispatch({ type: "OPEN_MODAL", modal: "confirmDelete" });
    }
  });

  const handleEditTodo = useCallback((values: Record<string, string>) => {
    if (!todo) return;
    const updates: Record<string, any> = {};
    const title = values.title?.trim();
    if (title && title !== todo.title) updates.title = title;

    if (values.due !== undefined) {
      const dueTrimmed = values.due.trim();
      if (dueTrimmed === "" && todo.due_date) {
        updates.due_date = null;
      } else if (dueTrimmed) {
        const parsed = parseDate(dueTrimmed);
        if (parsed) updates.due_date = formatDateForDb(parsed);
      }
    }

    if (values.priority && values.priority !== todo.priority) {
      updates.priority = values.priority;
    }
    if (values.notes !== undefined) {
      const notesTrimmed = values.notes.trim();
      updates.notes = notesTrimmed || null;
    }

    if (Object.keys(updates).length > 0) {
      updateTodo(todo.id, updates);
      dispatch({ type: "REFRESH" });
    }
    dispatch({ type: "CLOSE_MODAL" });
  }, [todo, dispatch]);

  const handleSetDue = useCallback((value: string) => {
    if (todo) {
      const trimmed = value.trim();
      if (trimmed === "") {
        updateTodo(todo.id, { due_date: null });
      } else {
        const parsed = parseDate(trimmed);
        if (parsed) updateTodo(todo.id, { due_date: formatDateForDb(parsed) });
      }
      dispatch({ type: "REFRESH" });
    }
    dispatch({ type: "CLOSE_MODAL" });
  }, [todo, dispatch]);

  const handleConfirmDelete = useCallback(() => {
    if (todo) {
      deleteTodo(todo.id);
      dispatch({ type: "CLOSE_MODAL" });
      dispatch({ type: "POP_VIEW" });
      dispatch({ type: "REFRESH" });
    }
  }, [todo, dispatch]);

  if (!todo) {
    return (
      <Box paddingX={1} paddingY={1}>
        <Text dimColor>Todo not found.</Text>
      </Box>
    );
  }

  const completed = !!todo.is_completed;
  const check = completed ? "✓" : "○";

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {state.modal === "setDue" && todo && (
        <InlineInput
          label="Due date"
          initialValue={todo.due_date ?? ""}
          onSubmit={handleSetDue}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {state.modal === "editTodo" && (
        <InputForm
          title="Edit Todo"
          fields={[
            { name: "title", label: "Title", value: todo.title },
            { name: "due", label: "Due date", value: todo.due_date ?? "" },
            { name: "priority", label: "Priority", value: todo.priority, type: "priority" },
            { name: "notes", label: "Notes", value: todo.notes ?? "" },
          ]}
          onSubmit={handleEditTodo}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {state.modal === "confirmDelete" && (
        <ConfirmDialog
          message={`Delete "${todo.title}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}

      <Box>
        <Text color={completed ? "green" : undefined} dimColor={!completed}>{check}</Text>
        <Text> </Text>
        {completed ? (
          <Text bold dimColor strikethrough>{todo.title}</Text>
        ) : (
          <Text bold>{todo.title}</Text>
        )}
      </Box>

      <Text> </Text>

      <Box>
        <Text dimColor>List:     </Text>
        <Text>{todo.list_title}</Text>
      </Box>

      <Box>
        <Text dimColor>Priority: </Text>
        {todo.priority === "prioritized" ? (
          <Text color="yellow">★ prioritized</Text>
        ) : (
          <Text>normal</Text>
        )}
      </Box>

      {todo.due_date && (
        <Box>
          <Text dimColor>Due:      </Text>
          <DateLabel dateStr={todo.due_date} isCompleted={completed} />
          <Text dimColor> ({todo.due_date})</Text>
        </Box>
      )}

      {completed && todo.completed_at && (
        <Box>
          <Text dimColor>Done:     </Text>
          <Text>{todo.completed_at}</Text>
        </Box>
      )}

      <Box>
        <Text dimColor>Created:  </Text>
        <Text>{todo.created_at}</Text>
      </Box>

      <Box>
        <Text dimColor>ID:       </Text>
        <Text dimColor>{todo.id}</Text>
      </Box>

      {todo.notes && (
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>Notes:</Text>
          <Text>{todo.notes}</Text>
        </Box>
      )}
    </Box>
  );
}
