import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../context.ts";

const VIEW_LABELS: Record<string, string> = {
  today: "Today",
  listIndex: "Lists",
  listDetail: "List",
  todoDetail: "Todo",
};

export function Header() {
  const { state } = useAppState();
  const label = VIEW_LABELS[state.view] ?? state.view;
  const tabs = state.view === "today" || state.view === "listIndex"
    ? ` [${state.view === "today" ? "Today" : "Lists"}]`
    : "";

  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">todo-tui</Text>
      <Text>  </Text>
      <Text dimColor>{label}{tabs}</Text>
    </Box>
  );
}
