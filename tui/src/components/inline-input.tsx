import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.ts";

interface Props {
  label: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function InlineInput({ label, initialValue = "", onSubmit, onCancel }: Props) {
  const [value, setValue] = useState(initialValue);
  const [cursorPos, setCursorPos] = useState(initialValue.length);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      onSubmit(value);
      return;
    }
    if (key.leftArrow) {
      setCursorPos((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.rightArrow) {
      setCursorPos((prev) => Math.min(value.length, prev + 1));
      return;
    }
    if (key.backspace || key.delete) {
      if (cursorPos > 0) {
        setValue((prev) => prev.slice(0, cursorPos - 1) + prev.slice(cursorPos));
        setCursorPos((prev) => prev - 1);
      }
      return;
    }
    if (input && !key.ctrl && !key.meta && !key.tab) {
      setValue((prev) => prev.slice(0, cursorPos) + input + prev.slice(cursorPos));
      setCursorPos((prev) => prev + input.length);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="single" borderLeft={false} borderRight={false} borderColor={theme.accent} paddingX={1}>
      <Text bold color={theme.accent}>{label}</Text>
      <Text> </Text>
      <Box>
        <Text>{value.slice(0, cursorPos)}<Text inverse>{value[cursorPos] ?? " "}</Text>{value.slice(cursorPos + 1)}</Text>
      </Box>
      <Text> </Text>
      <Text dimColor>Enter: submit  Esc: cancel</Text>
    </Box>
  );
}
