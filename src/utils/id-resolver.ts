import { getTodoIdByIndex, getTodoById } from "../db/repository.ts";
import { getDb } from "../db/connection.ts";

export function resolveId(input: string): string {
  // 1. Try as numeric index
  const idx = parseInt(input, 10);
  if (!isNaN(idx) && idx > 0 && String(idx) === input) {
    const todoId = getTodoIdByIndex(idx);
    if (todoId) return todoId;
    throw new Error(`No todo at index ${idx}. Run 'todo show' first to populate indices.`);
  }

  // 2. Try as full UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(input)) {
    const todo = getTodoById(input);
    if (todo) return input;
    throw new Error(`No todo found with ID ${input}`);
  }

  // 3. Try as UUID prefix
  const db = getDb();
  const matches = db
    .prepare("SELECT id FROM todos WHERE id LIKE ? || '%'")
    .all(input.toLowerCase()) as { id: string }[];

  if (matches.length === 1) return matches[0].id;
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous ID prefix '${input}' — matches ${matches.length} todos. Use a longer prefix.`
    );
  }

  throw new Error(`No todo found matching '${input}'`);
}
