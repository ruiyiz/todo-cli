export type ViewName = "today" | "listIndex" | "listDetail" | "todoDetail";
export type ModalType =
  | "none"
  | "addTodo"
  | "editTodo"
  | "confirmDelete"
  | "addList"
  | "renameList"
  | "setDue"
  | "help";
export type ListFilter = "active" | "completed" | "all";

export interface AppState {
  view: ViewName;
  viewStack: ViewName[];
  selectedListId: string | null;
  selectedTodoId: string | null;
  cursorIndex: number;
  cursorMemory: Record<string, number>;
  modal: ModalType;
  listFilter: ListFilter;
  refreshKey: number;
}

export type Action =
  | { type: "SWITCH_TOP_VIEW" }
  | { type: "PUSH_VIEW"; view: ViewName; listId?: string; todoId?: string }
  | { type: "POP_VIEW" }
  | { type: "SET_CURSOR"; index: number }
  | { type: "OPEN_MODAL"; modal: ModalType }
  | { type: "CLOSE_MODAL" }
  | { type: "CYCLE_FILTER" }
  | { type: "REFRESH" }
  | { type: "SELECT_TODO"; todoId: string };

export const initialState: AppState = {
  view: "today",
  viewStack: [],
  selectedListId: null,
  selectedTodoId: null,
  cursorIndex: 0,
  cursorMemory: {},
  modal: "none",
  listFilter: "active",
  refreshKey: 0,
};

function cursorKey(view: ViewName, selectedListId: string | null): string {
  if (view === "listDetail") return `listDetail:${selectedListId}`;
  return view;
}

const FILTER_CYCLE: ListFilter[] = ["active", "completed", "all"];

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SWITCH_TOP_VIEW": {
      const next = state.view === "today" ? "listIndex" : "today";
      const key = cursorKey(state.view, state.selectedListId);
      const mem = { ...state.cursorMemory, [key]: state.cursorIndex };
      return { ...state, view: next as ViewName, viewStack: [], cursorIndex: mem[next] ?? 0, cursorMemory: mem, modal: "none" };
    }
    case "PUSH_VIEW": {
      const key = cursorKey(state.view, state.selectedListId);
      const mem = { ...state.cursorMemory, [key]: state.cursorIndex };
      const newListId = action.listId ?? state.selectedListId;
      const newKey = cursorKey(action.view, newListId);
      return {
        ...state,
        viewStack: [...state.viewStack, state.view],
        view: action.view,
        selectedListId: newListId,
        selectedTodoId: action.todoId ?? state.selectedTodoId,
        cursorIndex: mem[newKey] ?? 0,
        cursorMemory: mem,
        modal: "none",
      };
    }
    case "POP_VIEW": {
      if (state.viewStack.length === 0) return state;
      const stack = [...state.viewStack];
      const prev = stack.pop()!;
      const key = cursorKey(state.view, state.selectedListId);
      const mem = { ...state.cursorMemory, [key]: state.cursorIndex };
      const prevKey = cursorKey(prev, state.selectedListId);
      return { ...state, view: prev, viewStack: stack, cursorIndex: mem[prevKey] ?? 0, cursorMemory: mem, modal: "none" };
    }
    case "SET_CURSOR":
      return { ...state, cursorIndex: action.index };
    case "OPEN_MODAL":
      return { ...state, modal: action.modal };
    case "CLOSE_MODAL":
      return { ...state, modal: "none" };
    case "CYCLE_FILTER": {
      const idx = FILTER_CYCLE.indexOf(state.listFilter);
      return { ...state, listFilter: FILTER_CYCLE[(idx + 1) % FILTER_CYCLE.length], cursorIndex: 0 };
    }
    case "REFRESH":
      return { ...state, refreshKey: state.refreshKey + 1 };
    case "SELECT_TODO":
      return { ...state, selectedTodoId: action.todoId };
    default:
      return state;
  }
}
