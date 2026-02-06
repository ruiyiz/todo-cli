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

export function formatTodoDetail(t: TodoWithList): string {
  const lines: string[] = [];
  const check = t.is_completed ? c().green("✓") : c().dim("○");
  const title = t.is_completed ? c().strikethrough.dim(t.title) : c().bold(t.title);
  lines.push(`${check} ${title}`);
  lines.push("");
  lines.push(`${c().dim("List:")}     ${t.list_title}`);
  lines.push(`${c().dim("Priority:")} ${t.priority}`);

  if (t.due_date) {
    const display = formatDateForDisplay(t.due_date);
    const label = isOverdue(t.due_date) && !t.is_completed
      ? c().red(`${display} (${t.due_date})`)
      : `${display} (${t.due_date})`;
    lines.push(`${c().dim("Due:")}      ${label}`);
  }

  if (t.notes) {
    lines.push(`${c().dim("Notes:")}    ${t.notes}`);
  }

  if (t.is_completed && t.completed_at) {
    lines.push(`${c().dim("Done:")}     ${t.completed_at}`);
  }

  lines.push(`${c().dim("Created:")}  ${t.created_at}`);
  lines.push(`${c().dim("ID:")}       ${t.id}`);
  return lines.join("\n");
}

export function formatListsPretty(lists: ListWithCount[]): string {
  if (lists.length === 0) return c().dim("  No lists found.");

  const maxId = Math.max(...lists.map((l) => l.logical_id));
  const idWidth = String(maxId).length;

  return lists
    .map((l) => {
      const id = c().dim(String(l.logical_id).padStart(idWidth));
      const name = c().bold(l.title);
      const counts = c().dim(`(${l.todo_count - l.completed_count} active, ${l.completed_count} done)`);
      return `  ${id}  ${name} ${counts}`;
    })
    .join("\n");
}
