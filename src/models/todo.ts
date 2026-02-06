import type { Priority } from "../types.ts";

export interface Todo {
  id: string;
  title: string;
  list_id: string;
  due_date: string | null;
  priority: Priority;
  is_completed: number;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoWithList extends Todo {
  list_title: string;
}
