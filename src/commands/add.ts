import type { Command } from "commander";
import { resolveList, createTodo } from "../db/repository.ts";
import { outputMessage, outputTodos } from "../formatters/index.ts";
import { parseDate, formatDateForDb } from "../utils/date.ts";
import { getFormat } from "../formatters/index.ts";
import { formatJson } from "../formatters/json.ts";
import type { GlobalOptions, Priority } from "../types.ts";

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .argument("[title]", "Title of the todo")
    .option("--title <title>", "Title (alternative to positional arg)")
    .option("--list <name>", "List to add to (name or numeric ID)", "Todos")
    .option("--due <date>", "Due date (natural language)")
    .option("--notes <notes>", "Additional notes")
    .option(
      "--priority <level>",
      "Priority: normal, prioritized",
      "normal"
    )
    .description("Add a new todo")
    .action((positionalTitle: string | undefined, cmdOpts: Record<string, unknown>) => {
      const opts = program.opts<GlobalOptions>();
      const title = positionalTitle || (cmdOpts.title as string);

      if (!title) {
        console.error("Title is required. Provide it as an argument or with --title.");
        process.exit(1);
      }

      const listName = cmdOpts.list as string;
      const list = resolveList(listName);
      if (!list) {
        console.error(`List "${listName}" not found. Create it with: todo list "${listName}" --create`);
        process.exit(1);
      }

      let dueDate: string | null = null;
      if (cmdOpts.due) {
        const parsed = parseDate(cmdOpts.due as string);
        if (!parsed) {
          console.error(`Could not parse date: "${cmdOpts.due}"`);
          process.exit(1);
        }
        dueDate = formatDateForDb(parsed);
      }

      const priority = cmdOpts.priority as Priority;
      if (!["normal", "prioritized"].includes(priority)) {
        console.error(`Invalid priority: "${priority}". Use normal or prioritized.`);
        process.exit(1);
      }

      const todo = createTodo({
        id: crypto.randomUUID(),
        title,
        list_id: list.id,
        due_date: dueDate,
        priority,
        notes: (cmdOpts.notes as string) ?? null,
      });

      const fmt = getFormat(opts);
      if (fmt === "json") {
        console.log(formatJson(todo));
      } else {
        outputMessage(`Added: ${todo.title}${dueDate ? ` (due ${dueDate})` : ""}`, opts);
      }
    });
}
