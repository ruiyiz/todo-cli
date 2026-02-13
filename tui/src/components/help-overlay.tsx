import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.ts";

interface Props {
  onClose: () => void;
}

interface Section {
  title: string;
  color: string;
  keys: [string, string][];
}

const SECTIONS: Section[] = [
  {
    title: "Global",
    color: "magenta",
    keys: [
      ["Ctrl+C", "Quit"],
      ["Esc", "Back / Close / Clear selection"],
      ["Tab", "Switch top-level view"],
      ["/", "Fuzzy search todos"],
      ["?", "Toggle help"],
    ],
  },
  {
    title: "Navigation",
    color: "blue",
    keys: [
      ["j / ↓", "Move cursor down"],
      ["k / ↑", "Move cursor up"],
      ["Enter", "Select / Open"],
    ],
  },
  {
    title: "Quick Actions",
    color: "green",
    keys: [
      ["x", "Toggle complete"],
      ["p", "Toggle priority (normal / prioritized)"],
      ["t", "Set due date to today"],
      ["T", "Set due date to tomorrow"],
      ["s", "Set due date (type any date)"],
      ["Space", "Toggle select for bulk edit"],
    ],
  },
  {
    title: "CRUD",
    color: "yellow",
    keys: [
      ["a", "Add todo / list"],
      ["e", "Edit todo / bulk edit selected"],
      ["d", "Delete todo / list"],
      ["r", "Rename list"],
    ],
  },
  {
    title: "Today View",
    color: "cyan",
    keys: [
      ["g", "Toggle grouping (date / list)"],
    ],
  },
  {
    title: "List Detail",
    color: "cyan",
    keys: [
      ["f", "Cycle filter (active / completed / all)"],
    ],
  },
  {
    title: "Forms",
    color: "white",
    keys: [
      ["Tab / Shift+Tab", "Move between fields"],
      ["Enter", "Submit"],
      ["Esc", "Cancel"],
      ["j/k", "Toggle priority (on priority field)"],
    ],
  },
];

export function HelpOverlay({ onClose }: Props) {
  useInput((_input, key) => {
    if (_input === "?") onClose();
  });

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.accent} paddingX={2} paddingY={1}>
      <Text bold color={theme.accent}>Keyboard Shortcuts</Text>
      <Text> </Text>
      {SECTIONS.map((section) => (
        <Box key={section.title} flexDirection="column" marginBottom={1}>
          <Text bold color={section.color as any}>{section.title}</Text>
          {section.keys.map(([k, desc]) => (
            <Box key={k}>
              <Text>  </Text>
              <Text bold color={theme.selection}>{k.padEnd(16)}</Text>
              <Text dimColor>{desc}</Text>
            </Box>
          ))}
        </Box>
      ))}
      <Text dimColor>Press </Text>
      <Box>
        <Text bold color={theme.selection}>?</Text>
        <Text dimColor> or </Text>
        <Text bold color={theme.selection}>Esc</Text>
        <Text dimColor> to close</Text>
      </Box>
    </Box>
  );
}
