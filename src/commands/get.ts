import type { Command } from "commander";
import { getTodoById } from "../db/repository.ts";
import { resolveId } from "../utils/id-resolver.ts";
import { getFormat } from "../formatters/index.ts";
import { formatJson } from "../formatters/json.ts";
import { formatTodoDetail } from "../formatters/pretty.ts";
import { formatTodoDetailPlain } from "../formatters/plain.ts";
import type { GlobalOptions } from "../types.ts";

export function registerGetCommand(program: Command): void {
  program
    .command("get")
    .argument("<id>", "Todo index (from last show), UUID, or UUID prefix")
    .description("Show details of a todo")
    .action((idInput: string) => {
      const opts = program.opts<GlobalOptions>();

      let todoId: string;
      try {
        todoId = resolveId(idInput);
      } catch (e: unknown) {
        console.error((e as Error).message);
        process.exit(1);
      }

      const todo = getTodoById(todoId);
      if (!todo) {
        console.error(`Todo not found: ${idInput}`);
        process.exit(1);
      }

      if (opts.quiet) return;

      const fmt = getFormat(opts);
      switch (fmt) {
        case "json":
          console.log(formatJson(todo));
          break;
        case "plain":
          console.log(formatTodoDetailPlain(todo));
          break;
        case "pretty":
          console.log(formatTodoDetail(todo));
          break;
      }
    });
}
