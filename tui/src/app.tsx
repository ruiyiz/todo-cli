import React, { useReducer } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { AppContext } from "./context.ts";
import { reducer, initialState } from "./state.ts";
import { Header } from "./components/header.tsx";
import { Footer } from "./components/footer.tsx";
import { HelpOverlay } from "./components/help-overlay.tsx";
import { SearchOverlay } from "./components/search-overlay.tsx";
import { getListById } from "@core/db/repository.ts";
import { TodayView } from "./views/today-view.tsx";
import { ListIndexView } from "./views/list-index-view.tsx";
import { ListDetailView } from "./views/list-detail-view.tsx";
import { TodoDetailView } from "./views/todo-detail-view.tsx";

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [state, dispatch] = useReducer(reducer, initialState);

  useInput((input, key) => {
    if (input === "q" && key.ctrl) {
      exit();
      return;
    }

    if (state.modal === "search") return;
    if (state.modal !== "none") {
      if (key.escape) dispatch({ type: "CLOSE_MODAL" });
      return;
    }
    if (input === "?") {
      dispatch({ type: "OPEN_MODAL", modal: "help" });
      return;
    }
    if (input === "/") {
      dispatch({ type: "OPEN_MODAL", modal: "search" });
      return;
    }
    if (key.tab && state.view !== "todoDetail") {
      dispatch({ type: "SWITCH_TOP_VIEW" });
      return;
    }
    if (key.escape && state.selectedTodoIds.size > 0) {
      dispatch({ type: "CLEAR_SELECTION" });
      return;
    }
    if (key.escape && state.viewStack.length > 0) {
      dispatch({ type: "POP_VIEW" });
      return;
    }
  });

  function renderView() {
    switch (state.view) {
      case "today":
        return <TodayView />;
      case "listIndex":
        return <ListIndexView />;
      case "listDetail":
        return <ListDetailView />;
      case "todoDetail":
        return <TodoDetailView />;
    }
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <Box flexDirection="column" height={stdout.rows}>
        <Header />
        {state.modal === "help" ? (
          <HelpOverlay onClose={() => dispatch({ type: "CLOSE_MODAL" })} />
        ) : state.modal === "search" ? (
          <SearchOverlay
            listId={state.view === "listDetail" ? state.selectedListId : null}
            listTitle={state.view === "listDetail" && state.selectedListId ? getListById(state.selectedListId)?.title ?? null : null}
            onClose={() => dispatch({ type: "CLOSE_MODAL" })}
            onOpen={(todoId, listId) => {
              dispatch({ type: "CLOSE_MODAL" });
              dispatch({ type: "PUSH_VIEW", view: "listDetail", listId });
              dispatch({ type: "PUSH_VIEW", view: "todoDetail", todoId });
            }}
          />
        ) : (
          <Box flexDirection="column" flexGrow={1}>
            {renderView()}
          </Box>
        )}
        <Footer />
      </Box>
    </AppContext.Provider>
  );
}
