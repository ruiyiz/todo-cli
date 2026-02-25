import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.ts";
import { getWeekday } from "../utils/date-input.ts";

interface Props {
  value: string;
  cursorPos: number;
  isActive: boolean;
}

export function DateFieldDisplay({ value, cursorPos, isActive }: Props) {
  const weekday = getWeekday(value);
  if (isActive) {
    const before = value.slice(0, cursorPos);
    const under = value[cursorPos] ?? " ";
    const after = value.slice(cursorPos + 1);
    return (
      <Box>
        <Box><Text>{before}</Text><Text inverse>{under}</Text><Text>{after}</Text></Box>
        {weekday && <Text color={theme.accent}>{"  "}[{weekday}]</Text>}
      </Box>
    );
  }
  return (
    <Box>
      <Text>{value}</Text>
      {weekday && <Text color={theme.accent}>{"  "}[{weekday}]</Text>}
    </Box>
  );
}
