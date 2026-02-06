import { Command } from "commander";
import { setColorEnabled } from "./utils/color.ts";
import { registerShowCommand } from "./commands/show.ts";
import { registerListCommand } from "./commands/list.ts";
import { registerAddCommand } from "./commands/add.ts";
import { registerEditCommand } from "./commands/edit.ts";
import { registerCompleteCommand } from "./commands/complete.ts";
import { registerDeleteCommand } from "./commands/delete.ts";
import { registerStatusCommand } from "./commands/status.ts";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("todo")
    .description("A CLI tool for managing todos")
    .version("1.0.0")
    .option("-j, --json", "Output as JSON")
    .option("--plain", "Output as tab-separated plain text")
    .option("-q, --quiet", "Suppress output")
    .option("--no-color", "Disable colors")
    .option("--no-input", "Disable interactive prompts")
    .hook("preAction", () => {
      const opts = program.opts();
      if (opts.color === false) {
        setColorEnabled(false);
      }
    });

  registerShowCommand(program);
  registerListCommand(program);
  registerAddCommand(program);
  registerEditCommand(program);
  registerCompleteCommand(program);
  registerDeleteCommand(program);
  registerStatusCommand(program);

  return program;
}
