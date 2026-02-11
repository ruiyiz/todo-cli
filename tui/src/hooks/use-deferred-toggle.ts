import { useRef, useState, useEffect } from "react";
import { completeTodo, updateTodo } from "@core/db/repository.ts";
import type { TodoWithList } from "@core/models/todo.ts";

interface PendingToggle {
  timer: ReturnType<typeof setTimeout>;
  newCompleted: boolean;
}

const DELAY_MS = 2000;

function commitToggle(todoId: string, completed: boolean) {
  if (completed) {
    completeTodo(todoId);
  } else {
    updateTodo(todoId, { is_completed: 0, completed_at: null });
  }
}

export function useDeferredToggle(dispatch: (action: { type: "REFRESH" }) => void) {
  const pending = useRef<Map<string, PendingToggle>>(new Map());
  const [, setTick] = useState(0);
  const rerender = () => setTick((n) => n + 1);

  useEffect(() => {
    return () => {
      for (const [todoId, entry] of pending.current) {
        clearTimeout(entry.timer);
        commitToggle(todoId, entry.newCompleted);
      }
      pending.current.clear();
    };
  }, []);

  function toggle(todo: TodoWithList) {
    const existing = pending.current.get(todo.id);
    if (existing) {
      clearTimeout(existing.timer);
      pending.current.delete(todo.id);
      rerender();
      return;
    }

    const newCompleted = !todo.is_completed;
    const timer = setTimeout(() => {
      pending.current.delete(todo.id);
      commitToggle(todo.id, newCompleted);
      dispatch({ type: "REFRESH" });
    }, DELAY_MS);

    pending.current.set(todo.id, { timer, newCompleted });
    rerender();
  }

  function applyOverrides<T extends TodoWithList>(todos: T[]): T[] {
    if (pending.current.size === 0) return todos;
    return todos.map((t) => {
      const entry = pending.current.get(t.id);
      if (!entry) return t;
      return { ...t, is_completed: entry.newCompleted ? 1 : 0 };
    });
  }

  return { toggle, applyOverrides };
}
