import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../context.ts";
import { theme } from "../theme.ts";

interface Hint {
  key: string;
  desc: string;
}

function h(key: string, desc: string): Hint {
  return { key, desc };
}

function getHints(view: string, modal: string, selectionCount: number): Hint[] {
  if (modal !== "none") return [h("Esc", "close"), h("Enter", "submit"), h("Tab", "next field")];

  const sys = [h("^C", "quit"), h("?", "help")];
  const sel = selectionCount > 0 ? [h("e", `bulk edit (${selectionCount})`), h("Esc", "deselect")] : [];
  const quickActions = [h("x", "toggle"), h("p", "priority"), h("s", "due")];
  switch (view) {
    case "today":
      return [h("Space", "select"), ...sel, ...quickActions, h("a", "add"), h("Enter", "edit"), h("d", "del"), h("g", "group"), h("Tab", "lists"), ...sys];
    case "listIndex":
      return [h("Enter", "open"), h("a", "add"), h("r", "rename"), h("d", "delete"), h("Tab", "today"), ...sys];
    case "listDetail":
      return [h("Space", "select"), ...sel, ...quickActions, h("a", "add"), h("Enter", "edit"), h("d", "del"), h("f", "filter"), ...(selectionCount === 0 ? [h("Esc", "back")] : []), h("Tab", "today"), ...sys];
    case "todoDetail":
      return [...quickActions, h("e", "edit"), h("d", "delete"), h("Esc", "back"), ...sys];
    default:
      return sys;
  }
}

export function Footer() {
  const { state } = useAppState();
  const hints = getHints(state.view, state.modal, state.selectedTodoIds.size);

  return (
    <Box borderStyle="single" borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} paddingX={1} flexWrap="wrap">
      {hints.map((hint, i) => (
        <Box key={hint.key + hint.desc} marginRight={1}>
          <Text bold color={theme.selection}>{hint.key}</Text>
          <Text dimColor> {hint.desc}</Text>
          {i < hints.length - 1 && <Text dimColor> </Text>}
        </Box>
      ))}
    </Box>
  );
}
