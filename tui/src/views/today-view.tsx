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
  const thisWeek = applyOverrides(raw.thisWeek);
  const next10Days = applyOverrides(raw.next10Days);
  const highPriority = applyOverrides(raw.highPriority);
  const all = [...overdue, ...dueToday, ...thisWeek, ...next10Days, ...highPriority];

  let globalIdx = 0;
  const sections: { label: string; color?: string; todos: TodoWithList[]; startIdx: number }[] = [];

  const lists = getAllLists();
  const listOptions = lists.map((l) => ({ value: l.id, label: l.title }));

  if (state.todayGroupBy === "list") {
    const byList = new Map<string, TodoWithList[]>();
    for (const todo of all) {
      let group = byList.get(todo.list_id);
      if (!group) {
        group = [];
        byList.set(todo.list_id, group);
      }
      group.push(todo);
    }
    const sortTodos = (todos: TodoWithList[]) =>
      todos.sort((a, b) => {
        const pa = a.priority === "prioritized" ? 0 : 1;
        const pb = b.priority === "prioritized" ? 0 : 1;
        if (pa !== pb) return pa - pb;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      });
    for (const list of lists) {
      const todos = byList.get(list.id);
      if (!todos) continue;
      sections.push({ label: list.title, color: theme.accent, todos: sortTodos(todos), startIdx: globalIdx });
      globalIdx += todos.length;
    }
  } else {
    if (overdue.length > 0) {
      sections.push({ label: "Overdue", color: theme.danger, todos: overdue, startIdx: globalIdx });
      globalIdx += overdue.length;
    }
    if (dueToday.length > 0) {
      sections.push({ label: "Today", todos: dueToday, startIdx: globalIdx });
      globalIdx += dueToday.length;
    }
    if (thisWeek.length > 0) {
      sections.push({ label: "This week", todos: thisWeek, startIdx: globalIdx });
      globalIdx += thisWeek.length;
    }
    if (next10Days.length > 0) {
      sections.push({ label: "Next 10 days", color: theme.accent, todos: next10Days, startIdx: globalIdx });
      globalIdx += next10Days.length;
    }
    if (highPriority.length > 0) {
      sections.push({ label: "Prioritized", color: theme.priority, todos: highPriority, startIdx: globalIdx });
      globalIdx += highPriority.length;
    }
  }

  const flatItems = sections.flatMap((s) => s.todos);

  const clampCursor = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, all.length - 1)),
    [all.length]
  );

  useEffect(() => {
    if (all.length > 0 && state.cursorIndex >= all.length) {
      dispatch({ type: "SET_CURSOR", index: 0 });
    }
  }, [state.cursorIndex, all.length, dispatch]);

  const currentTodo: TodoWithList | undefined = flatItems[state.cursorIndex];

  const hasSelection = state.selectedTodoIds.size > 0;

  useInput((input, key) => {
    if (state.modal !== "none") return;

    if (input === "j" || key.downArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex + 1) });
    } else if (input === "k" || key.upArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex - 1) });
    } else if (input === "g") {
      dispatch({ type: "TOGGLE_TODAY_GROUP" });
    } else if (key.pageUp) {
      dispatch({ type: "SET_CURSOR", index: 0 });
    } else if (key.pageDown) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(all.length - 1) });
    } else if (input === " " && currentTodo) {
      dispatch({ type: "TOGGLE_SELECT", todoId: currentTodo.id });
    } else if (input === "e" && currentTodo) {
      if (hasSelection) {
        dispatch({ type: "OPEN_MODAL", modal: "bulkEditTodo" });
      } else {
        dispatch({ type: "OPEN_MODAL", modal: "editTodo" });
      }
    } else if (hasSelection) {
      return;
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

  const handleBulkEditTodo = useCallback((values: Record<string, string>) => {
    const updates: Record<string, any> = {};
    if (values.list && values.list !== "") updates.list_id = values.list;
    if (values.due?.trim()) {
      const parsed = parseDate(values.due.trim());
      if (parsed) updates.due_date = formatDateForDb(parsed);
    }
    if (values.priority && values.priority !== "") updates.priority = values.priority;
    if (values.status && values.status !== "") {
      const completing = values.status === "completed";
      updates.is_completed = completing ? 1 : 0;
      updates.completed_at = completing
        ? new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
        : null;
    }
    if (Object.keys(updates).length > 0) {
      for (const id of state.selectedTodoIds) {
        updateTodo(id, updates);
      }
      dispatch({ type: "REFRESH" });
    }
    dispatch({ type: "CLEAR_SELECTION" });
    dispatch({ type: "CLOSE_MODAL" });
  }, [state.selectedTodoIds, dispatch]);

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
            { name: "notes", label: "Notes", value: "", type: "multiline" },
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
            { name: "notes", label: "Notes", value: currentTodo.notes ?? "", type: "multiline" },
          ]}
          onSubmit={handleEditTodo}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {state.modal === "bulkEditTodo" && (
        <InputForm
          title={`Bulk Edit (${state.selectedTodoIds.size} selected)`}
          fields={[
            { name: "list", label: "List", value: "", type: "list", options: [{ value: "", label: "(no change)" }, ...listOptions] },
            { name: "due", label: "Due date", value: "", type: "date" },
            { name: "priority", label: "Priority", value: "", type: "list", options: [{ value: "", label: "(no change)" }, { value: "normal", label: "normal" }, { value: "prioritized", label: "prioritized" }] },
            { name: "status", label: "Status", value: "", type: "list", options: [{ value: "", label: "(no change)" }, { value: "active", label: "active" }, { value: "completed", label: "completed" }] },
          ]}
          onSubmit={handleBulkEditTodo}
          onCancel={() => { dispatch({ type: "CLEAR_SELECTION" }); dispatch({ type: "CLOSE_MODAL" }); }}
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
                isMarked={state.selectedTodoIds.has(todo.id)}
                showList={false}
              />
            ))}
          </Box>
        ))
      )}
    </Box>
  );
}
