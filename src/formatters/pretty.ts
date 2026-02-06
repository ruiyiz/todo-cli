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

const LIST_NAME_MAX = 20;

function trimListName(name: string): string {
  if (name.length <= LIST_NAME_MAX) return name.padEnd(LIST_NAME_MAX);
  return name.slice(0, LIST_NAME_MAX - 1) + "…";
}

const LIST_COLORS = [
  (text: string) => c().dim(text),
  (text: string) => c().rgb(130, 130, 160)(text),
];

function trimTitle(title: string, maxWidth: number): string {
  if (title.length <= maxWidth) return title;
  if (maxWidth <= 1) return "…";
  return title.slice(0, maxWidth - 1) + "…";
}

export function formatTodosPretty(todos: TodoWithList[], startIndex = 1): string {
  if (todos.length === 0) return c().dim("  No todos found.");

  const termWidth = process.stdout.columns || 80;
  const lines: string[] = [];
  let colorIdx = 0;
  let prevList = "";
  for (let i = 0; i < todos.length; i++) {
    const t = todos[i];
    if (t.list_title !== prevList) {
      if (prevList !== "") colorIdx = (colorIdx + 1) % LIST_COLORS.length;
      prevList = t.list_title;
    }
    const idx = c().dim(`${String(startIndex + i).padStart(3)}.`);
    const check = t.is_completed ? c().green("✓") : c().dim("○");
    const list = LIST_COLORS[colorIdx](trimListName(t.list_title));
    const parts = [idx, check, list];

    // 4 (idx) + 1 (check) + LIST_NAME_MAX (list) + spaces between = 4+1+1+1+20 = 27
    let suffixWidth = 0;
    const suffix: string[] = [];

    if (t.due_date) {
      const display = formatDateForDisplay(t.due_date);
      const dateStr = isOverdue(t.due_date) && !t.is_completed
        ? c().red(display)
        : c().cyan(display);
      suffix.push(dateStr);
      suffixWidth += 1 + display.length;
    }

    const pSym = PRIORITY_SYMBOLS[t.priority];
    if (pSym) {
      suffix.push(priorityColor(t.priority, pSym));
      suffixWidth += 1 + pSym.length;
    }

    const available = termWidth - 27 - suffixWidth - 1;
    const trimmed = trimTitle(t.title, available);
    const title = t.is_completed ? c().strikethrough.dim(trimmed) : c().bold.white(trimmed);

    parts.push(title, ...suffix);
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

  if (t.is_completed && t.completed_at) {
    lines.push(`${c().dim("Done:")}     ${t.completed_at}`);
  }

  lines.push(`${c().dim("Created:")}  ${t.created_at}`);
  lines.push(`${c().dim("ID:")}       ${t.id}`);

  if (t.notes) {
    const noteLines = t.notes.split("\n");
    lines.push(`${c().dim("Notes:")}    ${noteLines[0]}`);
    const pad = "          ";
    for (let i = 1; i < noteLines.length; i++) {
      lines.push(`${pad}${noteLines[i]}`);
    }
  }

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
