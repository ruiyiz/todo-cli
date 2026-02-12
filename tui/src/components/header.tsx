import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../context.ts";
import { theme } from "../theme.ts";

export function Header() {
  const { state } = useAppState();
  const isToday = state.view === "today";

  return (
    <Box borderStyle="single" borderLeft={false} borderRight={false} paddingX={1} gap={1} marginBottom={1}>
      {isToday ? (
        <Text bold backgroundColor={theme.accent} color={theme.accentFg}> Today </Text>
      ) : (
        <Text dimColor> Today </Text>
      )}
      {!isToday ? (
        <Text bold backgroundColor={theme.accent} color={theme.accentFg}> Lists </Text>
      ) : (
        <Text dimColor> Lists </Text>
      )}
    </Box>
  );
}
