import type { TodoWithList } from "../models/todo.ts";
import type { ListWithCount } from "../models/list.ts";

export function formatTodosPlain(todos: TodoWithList[], startIndex = 1): string {
  return todos
    .map((t, i) => {
      const idx = startIndex + i;
      const done = t.is_completed ? "x" : " ";
      const parts = [idx, done, t.id, t.title, t.list_title, t.due_date ?? "", t.priority];
      return parts.join("\t");
    })
    .join("\n");
}

export function formatTodoDetailPlain(t: TodoWithList): string {
  return [t.id, t.is_completed ? "x" : " ", t.title, t.list_title, t.due_date ?? "", t.priority, t.notes ?? "", t.created_at, t.completed_at ?? ""].join("\t");
}

export function formatListsPlain(lists: ListWithCount[]): string {
  return lists
    .map((l) => [l.logical_id, l.title, l.todo_count, l.completed_count].join("\t"))
    .join("\n");
}
