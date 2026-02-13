import { useMemo, useState } from "react";
import { useAppState } from "../context.ts";
import { queryTodos } from "@core/db/repository.ts";
import type { TodoWithList } from "@core/models/todo.ts";

interface FuzzyResult {
  todo: TodoWithList;
  score: number;
}

function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  if (query.length === 0) return { match: true, score: 0 };

  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  let score = 0;
  let prevMatchIdx = -2;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 1;
      if (ti === prevMatchIdx + 1) score += 2; // consecutive bonus
      if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-") score += 3; // word boundary
      prevMatchIdx = ti;
      qi++;
    }
  }

  return { match: qi === q.length, score };
}

export function useSearch(listId: string | null) {
  const { state } = useAppState();
  const [query, setQuery] = useState("");

  const results = useMemo<TodoWithList[]>(() => {
    const opts: { listId?: string; includeCompleted: boolean } = { includeCompleted: true };
    if (listId) opts.listId = listId;
    const all = queryTodos(opts);

    if (query.length === 0) return all;

    const matched: FuzzyResult[] = [];
    for (const todo of all) {
      const { match, score } = fuzzyMatch(query, todo.title);
      if (match) matched.push({ todo, score });
    }
    matched.sort((a, b) => b.score - a.score);
    return matched.map((r) => r.todo);
  }, [listId, query, state.refreshKey]);

  return { results, query, setQuery };
}
