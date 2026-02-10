import { useMemo } from "react";
import { useAppState } from "../context.ts";
import {
  getAllLists,
  queryTodos,
  getTodoById,
  getListById,
} from "@core/db/repository.ts";
import type { ListWithCount } from "@core/models/list.ts";
import type { TodoWithList } from "@core/models/todo.ts";

export function useLists(): ListWithCount[] {
  const { state } = useAppState();
  return useMemo(() => getAllLists(), [state.refreshKey]);
}

export function useListTodos(): TodoWithList[] {
  const { state } = useAppState();
  return useMemo(() => {
    if (!state.selectedListId) return [];
    const opts: { listId: string; isCompleted?: boolean; includeCompleted?: boolean } = {
      listId: state.selectedListId,
    };
    if (state.listFilter === "active") opts.isCompleted = false;
    else if (state.listFilter === "completed") opts.isCompleted = true;
    else opts.includeCompleted = true;
    return queryTodos(opts);
  }, [state.selectedListId, state.listFilter, state.refreshKey]);
}

export function useTodoDetail(): TodoWithList | null {
  const { state } = useAppState();
  return useMemo(() => {
    if (!state.selectedTodoId) return null;
    return getTodoById(state.selectedTodoId);
  }, [state.selectedTodoId, state.refreshKey]);
}

export function useListTitle(): string {
  const { state } = useAppState();
  return useMemo(() => {
    if (!state.selectedListId) return "";
    const list = getListById(state.selectedListId);
    return list?.title ?? "";
  }, [state.selectedListId, state.refreshKey]);
}
