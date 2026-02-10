import type { Command } from "commander";
import {
  queryTodos,
  resolveList,
  saveLastResult,
  type TodoQueryOptions,
} from "../db/repository.ts";
import { outputTodos } from "../formatters/index.ts";
import { todayStr, tomorrowStr, weekEndStr, parseDate, formatDateForDb } from "../utils/date.ts";
import type { GlobalOptions } from "../types.ts";

type Filter = "today" | "tomorrow" | "week" | "overdue" | "upcoming" | "done" | "completed" | "all" | "prioritized" | string;

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
    case "done":
    case "completed":
      return { ...base, isCompleted: true, includeCompleted: true };
    case "all":
      return { ...base, includeCompleted: true };
    case "prioritized":
      return { ...base, priority: "prioritized", isCompleted: false };
    default: {
      const parsed = parseDate(filter);
      if (parsed) {
        const dateStr = formatDateForDb(parsed);
        return { ...base, dueDateFrom: dateStr, dueDateTo: dateStr };
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
        return { ...base, dueDateFrom: filter, dueDateTo: filter };
      }
      console.error(`Unknown filter: "${filter}". Use today, tomorrow, week, overdue, upcoming, done, all, prioritized, or a date.`);
      process.exit(1);
    }
  }
}

export { buildQuery };

export function registerShowCommand(program: Command): void {
  program
    .command("show")
    .argument("[filter]", "Filter: today, tomorrow, week, overdue, upcoming, done, all, prioritized, or a date")
    .option("-l, --list <name>", "Filter by list (name or numeric ID)")
    .description("Show todos (all active by default)")
    .action((filter: string | undefined, cmdOpts: Record<string, unknown>) => {
      const opts = program.opts<GlobalOptions>();
      let listId: string | undefined;

      if (cmdOpts.list) {
        const list = resolveList(cmdOpts.list as string);
        if (!list) {
          console.error(`List "${cmdOpts.list}" not found.`);
          process.exit(1);
        }
        listId = list.id;
      }

      const todos = filter
        ? queryTodos(buildQuery(filter, listId))
        : queryTodos({ listId });

      saveLastResult(todos);
      outputTodos(todos, opts);
    });
}
