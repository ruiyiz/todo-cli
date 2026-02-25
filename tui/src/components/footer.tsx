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

function getHints(view: string, modal: string, hasStack: boolean): Hint[] {
  if (modal === "search") return [h("^X", "toggle"), h("^P", "priority"), h("^S", "due"), h("^D", "del"), h("Enter", "open"), h("Esc", "close")];
  if (modal !== "none") return [h("Esc", "close"), h("Enter", "submit"), h("Tab", "next field")];

  const hints: Hint[] = [h("/", "search")];

  if (view !== "todoDetail") hints.push(h("Tab", view === "today" ? "lists" : "today"));
  if (hasStack) hints.push(h("Esc", "back"));

  hints.push(h("^Q", "quit"), h("?", "help"));
  return hints;
}

export function Footer() {
  const { state } = useAppState();
  const hints = getHints(state.view, state.modal, state.viewStack.length > 0);

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
