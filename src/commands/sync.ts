import type { Command } from "commander";
import { syncDb } from "../db/connection.ts";
import { isRemoteEnabled, getTursoConfig } from "../config.ts";
import { outputMessage } from "../formatters/index.ts";
import type { GlobalOptions } from "../types.ts";

export function registerSyncCommand(program: Command): void {
  program
    .command("sync")
    .description("Sync with remote Turso database")
    .action(() => {
      const opts = program.opts<GlobalOptions>();
      if (!isRemoteEnabled()) {
        outputMessage(
          "Remote not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN or add to ~/.config/todo/config.json",
          opts
        );
        process.exit(1);
      }
      syncDb();
      const { url } = getTursoConfig();
      outputMessage(`Synced with ${url}`, opts);
    });
}
