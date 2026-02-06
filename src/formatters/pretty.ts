import { c } from "../utils/color.ts";
import { formatDateForDisplay, isOverdue } from "../utils/date.ts";
import type { TodoWithList } from "../models/todo.ts";
import type { ListWithCount } from "../models/list.ts";

const PRIORITY_SYMBOLS: Record<string, string> = {
  high: "!!!",
  medium: "!!",
  low: "!",
  none: "",
};

function priorityColor(priority: string, text: string): string {
  switch (priority) {
    case "high":
      return c().red(text);
    case "medium":
      return c().yellow(text);
    case "low":
      return c().blue(text);
    default:
      return text;
  }
}

export function formatTodosPretty(todos: TodoWithList[], startIndex = 1): string {
  if (todos.length === 0) return c().dim("  No todos found.");

  const lines: string[] = [];
  for (let i = 0; i < todos.length; i++) {
    const t = todos[i];
    const idx = c().dim(`${String(startIndex + i).padStart(3)}.`);
    const check = t.is_completed ? c().green("✓") : c().dim("○");
    const title = t.is_completed ? c().strikethrough.dim(t.title) : t.title;
    const parts = [idx, check, title];

    const pSym = PRIORITY_SYMBOLS[t.priority];
    if (pSym) parts.push(priorityColor(t.priority, pSym));

    if (t.due_date) {
      const display = formatDateForDisplay(t.due_date);
      const dateStr = isOverdue(t.due_date) && !t.is_completed
        ? c().red(display)
        : c().cyan(display);
      parts.push(dateStr);
    }

    parts.push(c().dim(`[${t.list_title}]`));
    lines.push(parts.join(" "));
  }
  return lines.join("\n");
}

export function formatListsPretty(lists: ListWithCount[]): string {
  if (lists.length === 0) return c().dim("  No lists found.");

  return lists
    .map((l) => {
      const name = c().bold(l.title);
      const counts = c().dim(`(${l.todo_count - l.completed_count} active, ${l.completed_count} done)`);
      return `  ${name} ${counts}`;
    })
    .join("\n");
}
