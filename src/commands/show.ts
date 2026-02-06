import type { Command } from "commander";
import {
  queryTodos,
  getListByTitle,
  saveLastResult,
  type TodoQueryOptions,
} from "../db/repository.ts";
import { outputTodos, outputMessage } from "../formatters/index.ts";
import { todayStr, tomorrowStr, weekEndStr, parseDate, formatDateForDb } from "../utils/date.ts";
import { c } from "../utils/color.ts";
import type { GlobalOptions } from "../types.ts";
import type { TodoWithList } from "../models/todo.ts";

type Filter = "today" | "tomorrow" | "week" | "overdue" | "upcoming" | "completed" | "all" | string;

function buildQuery(filter: Filter, listId?: string): TodoQueryOptions {
  const today = todayStr();
  const base: TodoQueryOptions = { listId };

  switch (filter) {
    case "today":
      return { ...base, dueDateFrom: today, dueDateTo: today, isCompleted: false };
    case "tomorrow": {
      const tmr = tomorrowStr();
      return { ...base, dueDateFrom: tmr, dueDateTo: tmr, isCompleted: false };
    }
    case "week":
      return { ...base, dueDateFrom: today, dueDateTo: weekEndStr(), isCompleted: false };
    case "overdue":
      return { ...base, overdueBeforeDate: today, isCompleted: false };
    case "upcoming":
      return { ...base, dueDateFrom: today, isCompleted: false };
    case "completed":
      return { ...base, isCompleted: true, includeCompleted: true };
    case "all":
      return { ...base, includeCompleted: true };
    default: {
      // Try as a date
      const parsed = parseDate(filter);
      if (parsed) {
        const dateStr = formatDateForDb(parsed);
        return { ...base, dueDateFrom: dateStr, dueDateTo: dateStr };
      }
      // Also try as raw YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
        return { ...base, dueDateFrom: filter, dueDateTo: filter };
      }
      console.error(`Unknown filter: "${filter}". Use today, tomorrow, week, overdue, upcoming, completed, all, or a date.`);
      process.exit(1);
    }
  }
}

export function registerShowCommand(program: Command): void {
  program
    .command("show", { isDefault: true })
    .argument("[filter]", "Filter: today, tomorrow, week, overdue, upcoming, completed, all, or a date")
    .option("--list <name>", "Scope to a specific list")
    .description("Show todos (default: today + overdue)")
    .action((filter: string | undefined, cmdOpts: Record<string, unknown>) => {
      const opts = program.opts<GlobalOptions>();
      let listId: string | undefined;

      if (cmdOpts.list) {
        const list = getListByTitle(cmdOpts.list as string);
        if (!list) {
          console.error(`List "${cmdOpts.list}" not found.`);
          process.exit(1);
        }
        listId = list.id;
      }

      let allTodos: TodoWithList[];

      if (!filter) {
        // Default: show today + overdue
        const today = todayStr();
        const overdue = queryTodos(buildQuery("overdue", listId));
        const todayTodos = queryTodos(buildQuery("today", listId));

        // Deduplicate (overdue won't overlap with today, but just in case)
        const seenIds = new Set(overdue.map((t) => t.id));
        const combined = [...overdue];
        for (const t of todayTodos) {
          if (!seenIds.has(t.id)) combined.push(t);
        }
        allTodos = combined;

        if (overdue.length > 0 && !opts.json && !opts.plain) {
          outputMessage(c().red.bold(`Overdue (${overdue.length}):`), opts);
          outputTodos(overdue, opts);
          outputMessage("", opts);
          outputMessage(c().bold(`Today (${todayTodos.length}):`), opts);
          outputTodos(todayTodos, opts, overdue.length + 1);
          saveLastResult(allTodos);
          return;
        }
      } else {
        allTodos = queryTodos(buildQuery(filter, listId));
      }

      saveLastResult(allTodos);
      outputTodos(allTodos, opts);
    });
}
