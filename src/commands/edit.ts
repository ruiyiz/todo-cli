import type { Command } from "commander";
import { getTodoById, updateTodo, getListByTitle } from "../db/repository.ts";
import { resolveId } from "../utils/id-resolver.ts";
import { parseDate, formatDateForDb } from "../utils/date.ts";
import { outputMessage } from "../formatters/index.ts";
import { getFormat } from "../formatters/index.ts";
import { formatJson } from "../formatters/json.ts";
import type { GlobalOptions, Priority } from "../types.ts";

export function registerEditCommand(program: Command): void {
  program
    .command("edit")
    .argument("<id>", "Todo ID, index, or UUID prefix")
    .option("--title <title>", "New title")
    .option("--list <name>", "Move to a different list")
    .option("--due <date>", "New due date (natural language)")
    .option("--clear-due", "Remove due date")
    .option("--notes <notes>", "New notes")
    .option("--priority <level>", "New priority: none, low, medium, high")
    .option("--complete", "Mark as complete")
    .option("--incomplete", "Mark as incomplete")
    .description("Edit an existing todo")
    .action((idInput: string, cmdOpts: Record<string, unknown>) => {
      const opts = program.opts<GlobalOptions>();

      let todoId: string;
      try {
        todoId = resolveId(idInput);
      } catch (e: unknown) {
        console.error((e as Error).message);
        process.exit(1);
      }

      const updates: Record<string, unknown> = {};

      if (cmdOpts.title) updates.title = cmdOpts.title;

      if (cmdOpts.list) {
        const list = getListByTitle(cmdOpts.list as string);
        if (!list) {
          console.error(`List "${cmdOpts.list}" not found.`);
          process.exit(1);
        }
        updates.list_id = list.id;
      }

      if (cmdOpts.due) {
        const parsed = parseDate(cmdOpts.due as string);
        if (!parsed) {
          console.error(`Could not parse date: "${cmdOpts.due}"`);
          process.exit(1);
        }
        updates.due_date = formatDateForDb(parsed);
      }

      if (cmdOpts.clearDue) {
        updates.due_date = null;
      }

      if (cmdOpts.notes !== undefined) updates.notes = cmdOpts.notes;

      if (cmdOpts.priority) {
        const p = cmdOpts.priority as Priority;
        if (!["none", "low", "medium", "high"].includes(p)) {
          console.error(`Invalid priority: "${p}".`);
          process.exit(1);
        }
        updates.priority = p;
      }

      if (cmdOpts.complete) {
        updates.is_completed = 1;
        updates.completed_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
      }

      if (cmdOpts.incomplete) {
        updates.is_completed = 0;
        updates.completed_at = null;
      }

      if (Object.keys(updates).length === 0) {
        console.error("No changes specified. Use --title, --due, --priority, etc.");
        process.exit(1);
      }

      const todo = updateTodo(todoId, updates as any);

      const fmt = getFormat(opts);
      if (fmt === "json") {
        console.log(formatJson(todo));
      } else {
        outputMessage(`Updated: ${todo.title}`, opts);
      }
    });
}
