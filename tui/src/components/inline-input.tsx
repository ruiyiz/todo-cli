import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.ts";

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekday(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return new Date(value + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

function shiftDate(value: string, delta: number): string {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!value || !dateRegex.test(value)) {
    return localDateStr(today);
  }
  const d = new Date(value + "T00:00:00");
  d.setDate(d.getDate() + delta);
  if (d < today) return localDateStr(today);
  return localDateStr(d);
}

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
    if (key.upArrow) {
      const newVal = shiftDate(value, 1);
      setValue(newVal);
      setCursorPos(newVal.length);
      return;
    }
    if (key.downArrow) {
      const newVal = shiftDate(value, -1);
      setValue(newVal);
      setCursorPos(newVal.length);
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
        {getWeekday(value) && <Text color={theme.accent}>{"  "}[{getWeekday(value)}]</Text>}
      </Box>
      <Text> </Text>
      <Text dimColor>↑/↓: adjust date  Enter: submit  Esc: cancel</Text>
    </Box>
  );
}
