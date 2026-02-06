import type { Command } from "commander";
import {
  getAllLists,
  getListByTitle,
  createList,
  renameList,
  deleteList,
  getTodosByListTitle,
} from "../db/repository.ts";
import { outputLists, outputTodos, outputMessage } from "../formatters/index.ts";
import { confirm } from "../utils/prompt.ts";
import type { GlobalOptions } from "../types.ts";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .argument("[name]", "List name to show or manage")
    .option("--create", "Create the list if it does not exist")
    .option("--rename <new>", "Rename the list")
    .option("--delete", "Delete the list")
    .option("--force", "Skip confirmation for destructive actions")
    .description("Manage todo lists")
    .action((name: string | undefined, cmdOpts: Record<string, unknown>) => {
      const opts = program.opts<GlobalOptions>();

      // No name: show all lists
      if (!name) {
        const lists = getAllLists();
        outputLists(lists, opts);
        return;
      }

      // --create: create a new list
      if (cmdOpts.create) {
        const existing = getListByTitle(name);
        if (existing) {
          outputMessage(`List "${name}" already exists.`, opts);
          return;
        }
        const list = createList(crypto.randomUUID(), name);
        outputMessage(`Created list "${list.title}".`, opts);
        return;
      }

      // --rename: rename existing list
      if (cmdOpts.rename) {
        const list = getListByTitle(name);
        if (!list) {
          console.error(`List "${name}" not found.`);
          process.exit(1);
        }
        renameList(list.id, cmdOpts.rename as string);
        outputMessage(`Renamed "${name}" to "${cmdOpts.rename}".`, opts);
        return;
      }

      // --delete: delete a list
      if (cmdOpts.delete) {
        const list = getListByTitle(name);
        if (!list) {
          console.error(`List "${name}" not found.`);
          process.exit(1);
        }
        if (list.id === "00000000-0000-0000-0000-000000000001") {
          console.error("Cannot delete the default list.");
          process.exit(1);
        }
        if (
          !confirm(`Delete list "${name}" and all its todos?`, {
            noInput: opts.noInput,
            force: cmdOpts.force as boolean,
          })
        ) {
          outputMessage("Cancelled.", opts);
          return;
        }
        deleteList(list.id);
        outputMessage(`Deleted list "${name}".`, opts);
        return;
      }

      // Default: show todos in named list
      const list = getListByTitle(name);
      if (!list) {
        console.error(`List "${name}" not found. Use --create to create it.`);
        process.exit(1);
      }
      const todos = getTodosByListTitle(name);
      outputTodos(todos, opts);
    });
}
