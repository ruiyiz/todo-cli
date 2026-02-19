import type { Command } from "commander";
import { queryTodos, saveLastResult } from "../db/repository.ts";
import { outputTodos, outputMessage } from "../formatters/index.ts";
import { todayStr, tomorrowStr, weekEndStr } from "../utils/date.ts";
import { c } from "../utils/color.ts";
import type { GlobalOptions } from "../types.ts";

export function registerTodayCommand(program: Command): void {
  program
    .command("today")
    .description("Show today's agenda: overdue, due today, upcoming (7 days), and prioritized items")
    .action(() => {
      const opts = program.opts<GlobalOptions>();
      const today = todayStr();
      const weekEnd = weekEndStr();

      const overdue = queryTodos({ overdueBeforeDate: today, isCompleted: false });
      const dueToday = queryTodos({ dueDateFrom: today, dueDateTo: today, isCompleted: false });

      const seenIds = new Set<string>();
      for (const t of overdue) seenIds.add(t.id);
      for (const t of dueToday) seenIds.add(t.id);

      const upcomingRaw = queryTodos({ dueDateFrom: tomorrowStr(), dueDateTo: weekEnd, isCompleted: false });
      const upcoming = upcomingRaw.filter((t) => !seenIds.has(t.id));
      for (const t of upcoming) seenIds.add(t.id);

      const prioRaw = queryTodos({ priority: "prioritized", isCompleted: false });
      const prio = prioRaw.filter((t) => !seenIds.has(t.id));
      for (const t of prio) seenIds.add(t.id);

      const allTodos = [...overdue, ...dueToday, ...upcoming, ...prio];
      saveLastResult(allTodos);

      if (opts.json || opts.plain) {
        outputTodos(allTodos, opts);
        return;
      }

      if (allTodos.length === 0) {
        outputMessage(c().dim("  Nothing for today."), opts);
        return;
      }

      let idx = 1;
      if (overdue.length > 0) {
        outputMessage(c().red.bold(`Overdue (${overdue.length}):`), opts);
        outputTodos(overdue, opts, idx);
        idx += overdue.length;
        outputMessage("", opts);
      }

      if (dueToday.length > 0) {
        outputMessage(c().bold(`Due today (${dueToday.length}):`), opts);
        outputTodos(dueToday, opts, idx);
        idx += dueToday.length;
        outputMessage("", opts);
      }

      if (upcoming.length > 0) {
        outputMessage(c().bold(`Upcoming (7 days) (${upcoming.length}):`), opts);
        outputTodos(upcoming, opts, idx);
        idx += upcoming.length;
        outputMessage("", opts);
      }

      if (prio.length > 0) {
        outputMessage(c().bold(`Prioritized (${prio.length}):`), opts);
        outputTodos(prio, opts, idx);
      }
    });
}
