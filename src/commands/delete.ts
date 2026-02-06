import type { Command } from "commander";
import { deleteTodo, getTodoById } from "../db/repository.ts";
import { resolveId } from "../utils/id-resolver.ts";
import { outputMessage } from "../formatters/index.ts";
import { getFormat } from "../formatters/index.ts";
import { formatJson } from "../formatters/json.ts";
import { confirm } from "../utils/prompt.ts";
import type { GlobalOptions } from "../types.ts";

export function registerDeleteCommand(program: Command): void {
  program
    .command("delete")
    .argument("[ids...]", "Todo IDs, indices, or UUID prefixes")
    .option("--dry-run", "Preview which todos would be deleted")
    .option("--force", "Skip confirmation")
    .description("Delete todos")
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
          outputMessage("Would delete:", opts);
          for (const r of resolved) {
            outputMessage(`  - ${r.title}`, opts);
          }
        }
        return;
      }

      if (
        !confirm(
          `Delete ${resolved.length} todo${resolved.length > 1 ? "s" : ""}?`,
          { noInput: opts.noInput, force: cmdOpts.force as boolean }
        )
      ) {
        outputMessage("Cancelled.", opts);
        return;
      }

      for (const r of resolved) {
        deleteTodo(r.id);
      }

      const fmt = getFormat(opts);
      if (fmt === "json") {
        console.log(formatJson(resolved.map((r) => ({ ...r, deleted: true }))));
      } else {
        for (const r of resolved) {
          outputMessage(`Deleted: ${r.title}`, opts);
        }
      }
    });
}
