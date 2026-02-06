import type { Command } from "commander";
import { queryTodos, getListByTitle, saveLastResult } from "../db/repository.ts";
import { outputTodos, outputMessage } from "../formatters/index.ts";
import { todayStr } from "../utils/date.ts";
import { c } from "../utils/color.ts";
import type { GlobalOptions } from "../types.ts";
import type { TodoWithList } from "../models/todo.ts";

export function registerTodayCommand(program: Command): void {
  program
    .command("today")
    .description("Show today's agenda: overdue, due today, and WIP items")
    .action(() => {
      const opts = program.opts<GlobalOptions>();
      const today = todayStr();

      const overdue = queryTodos({ overdueBeforeDate: today, isCompleted: false });
      const dueToday = queryTodos({ dueDateFrom: today, dueDateTo: today, isCompleted: false });

      const seenIds = new Set<string>();
      for (const t of overdue) seenIds.add(t.id);
      for (const t of dueToday) seenIds.add(t.id);

      const wipList = getListByTitle("WIP");
      const wip: TodoWithList[] = [];
      if (wipList) {
        const wipTodos = queryTodos({ listId: wipList.id, isCompleted: false });
        for (const t of wipTodos) {
          if (!seenIds.has(t.id)) {
            wip.push(t);
            seenIds.add(t.id);
          }
        }
      }

      const allTodos = [...overdue, ...dueToday, ...wip];
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

      if (wip.length > 0) {
        outputMessage(c().bold(`WIP (${wip.length}):`), opts);
        outputTodos(wip, opts, idx);
      }
    });
}
