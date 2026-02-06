import type { Command } from "commander";
import {
  getAllLists,
  resolveList,
  getListByTitle,
  createList,
  renameList,
  reassignListId,
  deleteList,
} from "../db/repository.ts";
import { outputLists, outputMessage } from "../formatters/index.ts";
import { confirm } from "../utils/prompt.ts";
import type { GlobalOptions } from "../types.ts";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .argument("[list]", "List name or numeric ID")
    .option("--create", "Create a new list (argument is the name)")
    .option("--rename <new>", "Rename the list")
    .option("--id <number>", "Reassign numeric ID (swaps if taken)")
    .option("--delete", "Delete the list and all its todos")
    .option("--force", "Skip confirmation for destructive actions")
    .description("Manage todo lists (show all lists when no argument given)")
    .action((name: string | undefined, cmdOpts: Record<string, unknown>) => {
      const opts = program.opts<GlobalOptions>();

      if (!name) {
        const lists = getAllLists();
        outputLists(lists, opts);
        return;
      }

      if (cmdOpts.create) {
        const existing = getListByTitle(name);
        if (existing) {
          outputMessage(`List "${name}" already exists.`, opts);
          return;
        }
        const list = createList(crypto.randomUUID(), name);
        outputMessage(`Created list "${list.title}" (ID ${list.logical_id}).`, opts);
        return;
      }

      if (cmdOpts.rename) {
        const list = resolveList(name);
        if (!list) {
          console.error(`List "${name}" not found.`);
          process.exit(1);
        }
        renameList(list.id, cmdOpts.rename as string);
        outputMessage(`Renamed "${list.title}" to "${cmdOpts.rename}".`, opts);
        return;
      }

      if (cmdOpts.id !== undefined) {
        const newId = parseInt(cmdOpts.id as string, 10);
        if (isNaN(newId) || newId < 1) {
          console.error("ID must be a positive integer.");
          process.exit(1);
        }
        const list = resolveList(name);
        if (!list) {
          console.error(`List "${name}" not found.`);
          process.exit(1);
        }
        reassignListId(list.id, newId);
        outputMessage(`Reassigned "${list.title}" to ID ${newId}.`, opts);
        return;
      }

      if (cmdOpts.delete) {
        const list = resolveList(name);
        if (!list) {
          console.error(`List "${name}" not found.`);
          process.exit(1);
        }
        if (list.id === "00000000-0000-0000-0000-000000000001") {
          console.error("Cannot delete the default list.");
          process.exit(1);
        }
        if (
          !confirm(`Delete list "${list.title}" and all its todos?`, {
            noInput: opts.noInput,
            force: cmdOpts.force as boolean,
          })
        ) {
          outputMessage("Cancelled.", opts);
          return;
        }
        deleteList(list.id);
        outputMessage(`Deleted list "${list.title}".`, opts);
        return;
      }

      // Default: show info for the named list
      const resolved = resolveList(name);
      if (!resolved) {
        console.error(`List "${name}" not found. Use --create to create it.`);
        process.exit(1);
      }
      const lists = getAllLists().filter((l) => l.id === resolved.id);
      outputLists(lists, opts);
    });
}
