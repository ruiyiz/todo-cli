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

function getHints(view: string, modal: string): Hint[] {
  if (modal !== "none") return [h("Esc", "close"), h("Enter", "submit"), h("Tab", "next field")];

  const common = [h("^C", "quit"), h("?", "help")];
  switch (view) {
    case "today":
      return [h("j/k", "nav"), h("Enter", "edit"), h("x", "toggle"), h("p", "priority"), h("s", "due"), h("a", "add"), h("d", "del"), h("Tab", "lists"), ...common];
    case "listIndex":
      return [h("j/k", "nav"), h("Enter", "open"), h("a", "add"), h("r", "rename"), h("d", "delete"), h("Tab", "today"), ...common];
    case "listDetail":
      return [h("j/k", "nav"), h("Enter", "edit"), h("x", "toggle"), h("p", "priority"), h("s", "due"), h("a", "add"), h("d", "del"), h("f", "filter"), h("Esc", "back"), ...common];
    case "todoDetail":
      return [h("x", "toggle"), h("p", "priority"), h("s", "due"), h("e", "edit"), h("d", "delete"), h("Esc", "back"), ...common];
    default:
      return common;
  }
}

export function Footer() {
  const { state } = useAppState();
  const hints = getHints(state.view, state.modal);

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
