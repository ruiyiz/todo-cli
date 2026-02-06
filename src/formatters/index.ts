import type { GlobalOptions, OutputFormat } from "../types.ts";
import type { TodoWithList } from "../models/todo.ts";
import type { ListWithCount } from "../models/list.ts";
import { formatJson } from "./json.ts";
import { formatTodosPlain, formatListsPlain } from "./plain.ts";
import { formatTodosPretty, formatListsPretty } from "./pretty.ts";

export function getFormat(opts: GlobalOptions): OutputFormat {
  if (opts.json) return "json";
  if (opts.plain) return "plain";
  return "pretty";
}

export function outputTodos(
  todos: TodoWithList[],
  opts: GlobalOptions,
  startIndex = 1
): void {
  if (opts.quiet) return;
  const fmt = getFormat(opts);
  switch (fmt) {
    case "json":
      console.log(formatJson(todos));
      break;
    case "plain":
      console.log(formatTodosPlain(todos, startIndex));
      break;
    case "pretty":
      console.log(formatTodosPretty(todos, startIndex));
      break;
  }
}

export function outputLists(lists: ListWithCount[], opts: GlobalOptions): void {
  if (opts.quiet) return;
  const fmt = getFormat(opts);
  switch (fmt) {
    case "json":
      console.log(formatJson(lists));
      break;
    case "plain":
      console.log(formatListsPlain(lists));
      break;
    case "pretty":
      console.log(formatListsPretty(lists));
      break;
  }
}

export function outputMessage(message: string, opts: GlobalOptions): void {
  if (opts.quiet) return;
  console.log(message);
}
