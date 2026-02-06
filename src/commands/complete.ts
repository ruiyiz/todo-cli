import type { Command } from "commander";
import { completeTodo, getTodoById } from "../db/repository.ts";
import { resolveId } from "../utils/id-resolver.ts";
import { outputMessage } from "../formatters/index.ts";
import { getFormat } from "../formatters/index.ts";
import { formatJson } from "../formatters/json.ts";
import type { GlobalOptions } from "../types.ts";

export function registerCompleteCommand(program: Command): void {
  program
    .command("complete")
    .argument("[ids...]", "Todo IDs, indices, or UUID prefixes")
    .option("--dry-run", "Preview which todos would be completed")
    .description("Mark todos as complete")
    .action((ids: string[], cmdOpts: Record<string, unknown>) => {
      const opts = program.opts<GlobalOptions>();

      if (!ids || ids.length === 0) {
        console.error("Provide at least one todo ID or index.");
        process.exit(1);
      }

      const resolved: { id: string; title: string }[] = [];
      for (const input of ids) {
        try {
          const todoId = resolveId(input);
          const todo = getTodoById(todoId);
          if (todo) resolved.push({ id: todoId, title: todo.title });
        } catch (e: unknown) {
          console.error((e as Error).message);
          process.exit(1);
        }
      }

      if (cmdOpts.dryRun) {
        const fmt = getFormat(opts);
        if (fmt === "json") {
          console.log(formatJson(resolved));
        } else {
          outputMessage("Would complete:", opts);
          for (const r of resolved) {
            outputMessage(`  - ${r.title}`, opts);
          }
        }
        return;
      }

      for (const r of resolved) {
        completeTodo(r.id);
      }

      const fmt = getFormat(opts);
      if (fmt === "json") {
        console.log(formatJson(resolved.map((r) => ({ ...r, completed: true }))));
      } else {
        for (const r of resolved) {
          outputMessage(`Completed: ${r.title}`, opts);
        }
      }
    });
}
