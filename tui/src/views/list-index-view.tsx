import React, { useState, useCallback, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useAppState } from "../context.ts";
import { useLists } from "../hooks/use-data.ts";
import { ListRow } from "../components/list-row.tsx";
import { ConfirmDialog } from "../components/confirm-dialog.tsx";
import { InputForm } from "../components/input-form.tsx";
import { createList, renameList, deleteList } from "@core/db/repository.ts";
import { randomUUID } from "crypto";

export function ListIndexView() {
  const { state, dispatch } = useAppState();
  const lists = useLists();
  const [renameTarget, setRenameTarget] = useState<string | null>(null);

  const clampCursor = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, lists.length - 1)),
    [lists.length]
  );

  useEffect(() => {
    if (lists.length > 0 && state.cursorIndex >= lists.length) {
      dispatch({ type: "SET_CURSOR", index: 0 });
    }
  }, [state.cursorIndex, lists.length, dispatch]);

  const currentList = lists[state.cursorIndex];

  useInput((input, key) => {
    if (state.modal !== "none") return;

    if (input === "j" || key.downArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex + 1) });
    } else if (input === "k" || key.upArrow) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(state.cursorIndex - 1) });
    } else if (input === "g" || key.pageUp) {
      dispatch({ type: "SET_CURSOR", index: 0 });
    } else if (key.pageDown) {
      dispatch({ type: "SET_CURSOR", index: clampCursor(lists.length - 1) });
    } else if (key.return && currentList) {
      dispatch({ type: "PUSH_VIEW", view: "listDetail", listId: currentList.id });
    } else if (input === "a") {
      dispatch({ type: "OPEN_MODAL", modal: "addList" });
    } else if (input === "r" && currentList) {
      setRenameTarget(currentList.id);
      dispatch({ type: "OPEN_MODAL", modal: "renameList" });
    } else if (input === "d" && currentList) {
      dispatch({ type: "OPEN_MODAL", modal: "confirmDelete" });
    }
  });

  const handleAddList = useCallback((values: Record<string, string>) => {
    const title = values.title?.trim();
    if (title) {
      createList(randomUUID(), title);
      dispatch({ type: "REFRESH" });
    }
    dispatch({ type: "CLOSE_MODAL" });
  }, [dispatch]);

  const handleRenameList = useCallback((values: Record<string, string>) => {
    const newTitle = values.title?.trim();
    if (newTitle && renameTarget) {
      renameList(renameTarget, newTitle);
      dispatch({ type: "REFRESH" });
    }
    setRenameTarget(null);
    dispatch({ type: "CLOSE_MODAL" });
  }, [renameTarget, dispatch]);

  const handleDeleteList = useCallback(() => {
    if (currentList) {
      deleteList(currentList.id);
      dispatch({ type: "CLOSE_MODAL" });
      dispatch({ type: "REFRESH" });
      if (state.cursorIndex >= lists.length - 1) {
        dispatch({ type: "SET_CURSOR", index: Math.max(0, lists.length - 2) });
      }
    }
  }, [currentList, lists.length, state.cursorIndex, dispatch]);

  return (
    <Box flexDirection="column" paddingX={1}>
      {state.modal === "addList" && (
        <InputForm
          title="New List"
          fields={[{ name: "title", label: "Title", value: "" }]}
          onSubmit={handleAddList}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {state.modal === "renameList" && currentList && (
        <InputForm
          title="Rename List"
          fields={[{ name: "title", label: "Title", value: currentList.title }]}
          onSubmit={handleRenameList}
          onCancel={() => { setRenameTarget(null); dispatch({ type: "CLOSE_MODAL" }); }}
        />
      )}
      {state.modal === "confirmDelete" && currentList && (
        <ConfirmDialog
          message={`Delete list "${currentList.title}" and all its todos?`}
          onConfirm={handleDeleteList}
          onCancel={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {lists.length === 0 ? (
        <Box paddingY={1}>
          <Text dimColor>No lists. Press 'a' to create one.</Text>
        </Box>
      ) : (
        lists.map((list, i) => (
          <ListRow key={list.id} list={list} isSelected={i === state.cursorIndex} />
        ))
      )}
    </Box>
  );
}
