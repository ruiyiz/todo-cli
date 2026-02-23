import type { Command } from "commander";
import { getDbPathInfo } from "../db/connection.ts";
import { getTursoConfig } from "../config.ts";
import { getStats } from "../db/repository.ts";
import { getFormat, outputMessage } from "../formatters/index.ts";
import { formatJson } from "../formatters/json.ts";
import { c } from "../utils/color.ts";
import type { GlobalOptions } from "../types.ts";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show database info and todo statistics")
    .action(() => {
      const opts = program.opts<GlobalOptions>();
      const dbPath = getDbPathInfo();
      const stats = getStats();
      const { url } = getTursoConfig();
      const remote = url ?? "not configured";

      const fmt = getFormat(opts);
      if (fmt === "json") {
        console.log(formatJson({ dbPath, remote, ...stats }));
        return;
      }

      if (fmt === "plain") {
        console.log([dbPath, remote, stats.total, stats.completed, stats.overdue, stats.lists].join("\t"));
        return;
      }

      outputMessage(
        [
          `${c().bold("Database:")} ${dbPath}`,
          `${c().bold("Remote:")}   ${remote}`,
          `${c().bold("Lists:")}    ${stats.lists}`,
          `${c().bold("Todos:")}    ${stats.total} total, ${c().green(String(stats.completed))} completed, ${c().red(String(stats.overdue))} overdue`,
        ].join("\n"),
        opts
      );
    });
}
