import React, { useCallback, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useAppState } from "../context.ts";
import { useTodayData } from "../hooks/use-today.ts";
import { TodoRow } from "../components/todo-row.tsx";
import { SectionHeader } from "../components/section-header.tsx";
import { ConfirmDialog } from "../components/confirm-dialog.tsx";
import { InlineInput } from "../components/inline-input.tsx";
import { InputForm } from "../components/input-form.tsx";
import { updateTodo, deleteTodo, createTodo, getAllLists } from "@core/db/repository.ts";
import { parseDate, formatDateForDb } from "@core/utils/date.ts";
import type { TodoWithList } from "@core/models/todo.ts";
import type { Priority } from "@core/types.ts";
import { useDeferredToggle } from "../hooks/use-deferred-toggle.ts";
import { randomUUID } from "crypto";
import { theme } from "../theme.ts";

export function TodayView() {
  const { state, dispatch } = useAppState();
  const raw = useTodayData();
  const { toggle, applyOverrides } = useDeferredToggle(dispatch);
  const overdue = applyOverrides(raw.overdue);
  const dueToday = applyOverrides(raw.dueToday);
  const upcoming = applyOverrides(raw.upcoming);
  const highPriority = applyOverrides(raw.highPriority);
  const all = [...overdue, ...dueToday, ...upcoming, ...highPriority];

  const clampCursor = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, all.length - 1)),
    [all.length]
  );

  useEffect(() => {
    if (all.length > 0 && state.cursorIndex >= all.length) {
      dispatch({ type: "SET_CURSOR", index: 0 });
    }
  }, [state.cursorIndex, all.length, dispatch]);

  const currentTodo: TodoWithList | undefined = all[state.cursorIndex];

  const lists = getAllLists();
  const listOptions = lists.map((l) => ({ value: l.id, label: l.title }));

  useInput((input, key) => {
    if (state.modal !== "none") return;

    if (input === "j" || key.downArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex + 1) });
    } else if (input === "k" || key.upArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex - 1) });
    } else if (input === "g" || key.pageUp) {
      dispatch({ type: "SET_CURSOR", index: 0 });
    } else if (input === "G" || key.pageDown) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(all.length - 1) });
    } else if (key.return && currentTodo) {
      dispatch({ type: "OPEN_MODAL", modal: "editTodo" });
    } else if (input === "x" && currentTodo) {
      toggle(currentTodo);
    } else if (input === "p" && currentTodo) {
      const next: Priority = currentTodo.priority === "prioritized" ? "normal" : "prioritized";
      updateTodo(currentTodo.id, { priority: next });
      dispatch({ type: "REFRESH" });
    } else if (input === "s" && currentTodo) {
      dispatch({ type: "OPEN_MODAL", modal: "setDue" });
    } else if (input === "d" && currentTodo) {
      dispatch({ type: "OPEN_MODAL", modal: "confirmDelete" });
    } else if (input === "a") {
      dispatch({ type: "OPEN_MODAL", modal: "addTodo" });
    }
  });

  const handleAddTodo = useCallback((values: Record<string, string>) => {
    const title = values.title?.trim();
    if (title) {
      const listId = values.list || lists[0]?.id;
      if (listId) {
        let dueDate: string | null = null;
        if (values.due?.trim()) {
          const parsed = parseDate(values.due.trim());
          if (parsed) dueDate = formatDateForDb(parsed);
        }
        createTodo({
          id: randomUUID(),
          title,
          list_id: listId,
          due_date: dueDate,
          priority: (values.priority as Priority) || "normal",
          notes: values.notes?.trim() || null,
        });
        dispatch({ type: "REFRESH" });
      }
    }
    dispatch({ type: "CLOSE_MODAL" });
  }, [lists, dispatch]);

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
    if (values.list && values.list !== currentTodo.list_id) {
      updates.list_id = values.list;
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
      if (state.cursorIndex >= all.length - 1) {
        dispatch({ type: "SET_CURSOR", index: Math.max(0, all.length - 2) });
      }
    }
  }, [currentTodo, all.length, state.cursorIndex, dispatch]);

  let globalIdx = 0;
  const sections: { label: string; color?: string; todos: TodoWithList[]; startIdx: number }[] = [];

  if (overdue.length > 0) {
    sections.push({ label: "Overdue", color: theme.danger, todos: overdue, startIdx: globalIdx });
    globalIdx += overdue.length;
  }
  if (dueToday.length > 0) {
    sections.push({ label: "Due today", todos: dueToday, startIdx: globalIdx });
    globalIdx += dueToday.length;
  }
  if (upcoming.length > 0) {
    sections.push({ label: "Upcoming (7 days)", color: theme.accent, todos: upcoming, startIdx: globalIdx });
    globalIdx += upcoming.length;
  }
  if (highPriority.length > 0) {
    sections.push({ label: "Prioritized", color: theme.priority, todos: highPriority, startIdx: globalIdx });
    globalIdx += highPriority.length;
  }

  return (
    <Box flexDirection="column" paddingX={1} gap={1}>
      {state.modal === "addTodo" && (
        <InputForm
          title="Add Todo"
          fields={[
            { name: "title", label: "Title", value: "" },
            { name: "list", label: "List", value: lists[0]?.id ?? "", type: "list", options: listOptions },
            { name: "due", label: "Due date", value: "", type: "date" },
            { name: "priority", label: "Priority", value: "normal", type: "priority" },
            { name: "notes", label: "Notes", value: "" },
          ]}
          onSubmit={handleAddTodo}
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
      {state.modal === "editTodo" && currentTodo && (
        <InputForm
          title="Edit Todo"
          fields={[
            { name: "title", label: "Title", value: currentTodo.title },
            { name: "list", label: "List", value: currentTodo.list_id, type: "list", options: listOptions },
            { name: "due", label: "Due date", value: currentTodo.due_date ?? "", type: "date" },
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
      {all.length === 0 && state.modal !== "addTodo" ? (
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
