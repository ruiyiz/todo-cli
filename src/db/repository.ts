import { getDb } from "./connection.ts";
import type { Todo, TodoWithList } from "../models/todo.ts";
import type { List, ListWithCount } from "../models/list.ts";
import type { Priority } from "../types.ts";

// ── List Repository ──

export function getAllLists(): ListWithCount[] {
  const db = getDb();
  return db
    .query<ListWithCount, []>(
      `SELECT l.*,
              COUNT(t.id) as todo_count,
              SUM(CASE WHEN t.is_completed = 1 THEN 1 ELSE 0 END) as completed_count
       FROM lists l
       LEFT JOIN todos t ON t.list_id = l.id
       GROUP BY l.id
       ORDER BY l.logical_id`
    )
    .all();
}

export function getListByTitle(title: string): List | null {
  const db = getDb();
  return db.query<List, [string]>("SELECT * FROM lists WHERE title = ?").get(title);
}

export function getListById(id: string): List | null {
  const db = getDb();
  return db.query<List, [string]>("SELECT * FROM lists WHERE id = ?").get(id);
}

export function createList(id: string, title: string): List {
  const db = getDb();
  const maxRow = db.query<{ m: number | null }, []>("SELECT MAX(logical_id) as m FROM lists").get();
  const nextId = (maxRow?.m ?? 0) + 1;
  db.run("INSERT INTO lists (id, logical_id, title) VALUES (?, ?, ?)", [id, nextId, title]);
  return getListById(id)!;
}

export function renameList(id: string, newTitle: string): void {
  const db = getDb();
  db.run("UPDATE lists SET title = ? WHERE id = ?", [newTitle, id]);
}

export function deleteList(id: string): void {
  const db = getDb();
  db.run("DELETE FROM lists WHERE id = ?", [id]);
}

export function resolveList(input: string): List | null {
  // Try as logical ID (integer)
  const num = parseInt(input, 10);
  if (!isNaN(num) && String(num) === input) {
    const db = getDb();
    const row = db.query<List, [number]>("SELECT * FROM lists WHERE logical_id = ?").get(num);
    if (row) return row;
  }
  // Try by title, then by UUID
  return getListByTitle(input) || getListById(input);
}

export function reassignListId(listUuid: string, newLogicalId: number): void {
  const db = getDb();
  const current = db.query<List, [string]>("SELECT * FROM lists WHERE id = ?").get(listUuid);
  if (!current) throw new Error("List not found");
  if (current.logical_id === newLogicalId) return;

  const occupying = db.query<List, [number]>("SELECT * FROM lists WHERE logical_id = ?").get(newLogicalId);
  if (occupying) {
    // Swap: move occupying list to a temp value, assign target, then fix occupying
    db.run("UPDATE lists SET logical_id = -1 WHERE id = ?", [occupying.id]);
    db.run("UPDATE lists SET logical_id = ? WHERE id = ?", [newLogicalId, listUuid]);
    db.run("UPDATE lists SET logical_id = ? WHERE id = ?", [current.logical_id, occupying.id]);
  } else {
    db.run("UPDATE lists SET logical_id = ? WHERE id = ?", [newLogicalId, listUuid]);
  }
}

// ── Todo Repository ──

export function getTodoById(id: string): TodoWithList | null {
  const db = getDb();
  return db
    .query<TodoWithList, [string]>(
      `SELECT t.*, l.title as list_title FROM todos t JOIN lists l ON t.list_id = l.id WHERE t.id = ?`
    )
    .get(id);
}

export function createTodo(todo: {
  id: string;
  title: string;
  list_id: string;
  due_date?: string | null;
  priority?: Priority;
  notes?: string | null;
}): TodoWithList {
  const db = getDb();
  db.run(
    `INSERT INTO todos (id, title, list_id, due_date, priority, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      todo.id,
      todo.title,
      todo.list_id,
      todo.due_date ?? null,
      todo.priority ?? "none",
      todo.notes ?? null,
    ]
  );
  return getTodoById(todo.id)!;
}

export function updateTodo(
  id: string,
  updates: {
    title?: string;
    list_id?: string;
    due_date?: string | null;
    priority?: Priority;
    notes?: string | null;
    is_completed?: number;
    completed_at?: string | null;
  }
): TodoWithList {
  const db = getDb();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    setClauses.push("title = ?");
    values.push(updates.title);
  }
  if (updates.list_id !== undefined) {
    setClauses.push("list_id = ?");
    values.push(updates.list_id);
  }
  if (updates.due_date !== undefined) {
    setClauses.push("due_date = ?");
    values.push(updates.due_date);
  }
  if (updates.priority !== undefined) {
    setClauses.push("priority = ?");
    values.push(updates.priority);
  }
  if (updates.notes !== undefined) {
    setClauses.push("notes = ?");
    values.push(updates.notes);
  }
  if (updates.is_completed !== undefined) {
    setClauses.push("is_completed = ?");
    values.push(updates.is_completed);
  }
  if (updates.completed_at !== undefined) {
    setClauses.push("completed_at = ?");
    values.push(updates.completed_at);
  }

  if (setClauses.length > 0) {
    values.push(id);
    db.run(`UPDATE todos SET ${setClauses.join(", ")} WHERE id = ?`, values);
  }

  return getTodoById(id)!;
}

export function deleteTodo(id: string): void {
  const db = getDb();
  db.run("DELETE FROM todos WHERE id = ?", [id]);
}

export function completeTodo(id: string): void {
  const db = getDb();
  db.run(
    `UPDATE todos SET is_completed = 1, completed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?`,
    [id]
  );
}

export interface TodoQueryOptions {
  listId?: string;
  isCompleted?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdueBeforeDate?: string;
  includeCompleted?: boolean;
  priority?: string;
}

export function queryTodos(options: TodoQueryOptions): TodoWithList[] {
  const db = getDb();
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (options.listId) {
    conditions.push("t.list_id = ?");
    values.push(options.listId);
  }

  if (options.isCompleted !== undefined) {
    conditions.push("t.is_completed = ?");
    values.push(options.isCompleted ? 1 : 0);
  }

  if (options.dueDateFrom && options.dueDateTo) {
    conditions.push("t.due_date >= ? AND t.due_date <= ?");
    values.push(options.dueDateFrom, options.dueDateTo);
  } else if (options.dueDateFrom) {
    conditions.push("t.due_date >= ?");
    values.push(options.dueDateFrom);
  } else if (options.dueDateTo) {
    conditions.push("t.due_date <= ?");
    values.push(options.dueDateTo);
  }

  if (options.overdueBeforeDate) {
    conditions.push("t.due_date < ? AND t.due_date IS NOT NULL");
    values.push(options.overdueBeforeDate);
  }

  if (options.priority) {
    conditions.push("t.priority = ?");
    values.push(options.priority);
  }

  if (!options.includeCompleted && options.isCompleted === undefined) {
    conditions.push("t.is_completed = 0");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return db
    .query<TodoWithList, (string | number)[]>(
      `SELECT t.*, l.title as list_title
       FROM todos t
       JOIN lists l ON t.list_id = l.id
       ${where}
       ORDER BY
         t.is_completed ASC,
         l.logical_id ASC,
         t.due_date ASC NULLS LAST,
         CASE t.priority
           WHEN 'high' THEN 0
           WHEN 'medium' THEN 1
           WHEN 'low' THEN 2
           ELSE 3
         END,
         t.title ASC`
    )
    .all(...values);
}

export function getTodosByListTitle(listTitle: string): TodoWithList[] {
  const db = getDb();
  return db
    .query<TodoWithList, [string]>(
      `SELECT t.*, l.title as list_title
       FROM todos t
       JOIN lists l ON t.list_id = l.id
       WHERE l.title = ?
       ORDER BY t.is_completed ASC, t.created_at ASC`
    )
    .all(listTitle);
}

// ── Last Result (index mapping) ──

export function saveLastResult(todos: TodoWithList[]): void {
  const db = getDb();
  db.run("DELETE FROM _last_result");
  const stmt = db.prepare("INSERT INTO _last_result (idx, todo_id) VALUES (?, ?)");
  for (let i = 0; i < todos.length; i++) {
    stmt.run(i + 1, todos[i].id);
  }
}

export function getTodoIdByIndex(idx: number): string | null {
  const db = getDb();
  const row = db
    .query<{ todo_id: string }, [number]>("SELECT todo_id FROM _last_result WHERE idx = ?")
    .get(idx);
  return row?.todo_id ?? null;
}

// ── Stats ──

export function getStats(): {
  total: number;
  completed: number;
  overdue: number;
  lists: number;
} {
  const db = getDb();
  const total = db.query<{ c: number }, []>("SELECT COUNT(*) as c FROM todos").get()!.c;
  const completed = db
    .query<{ c: number }, []>("SELECT COUNT(*) as c FROM todos WHERE is_completed = 1")
    .get()!.c;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = db
    .query<{ c: number }, [string]>(
      "SELECT COUNT(*) as c FROM todos WHERE due_date < ? AND is_completed = 0 AND due_date IS NOT NULL"
    )
    .get(today)!.c;
  const lists = db.query<{ c: number }, []>("SELECT COUNT(*) as c FROM lists").get()!.c;
  return { total, completed, overdue, lists };
}
