import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Priority } from "@core/types.ts";
import { theme } from "../theme.ts";

interface Field {
  name: string;
  label: string;
  value: string;
  type?: "text" | "priority" | "list" | "date";
  options?: { value: string; label: string }[];
}

interface Props {
  title: string;
  fields: Field[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

const PRIORITIES: Priority[] = ["normal", "prioritized"];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  if (d < today) {
    return localDateStr(today);
  }
  d.setDate(d.getDate() + delta);
  return localDateStr(d);
}

export function InputForm({ title, fields: initialFields, onSubmit, onCancel }: Props) {
  const [fields, setFields] = useState(initialFields);
  const [activeField, setActiveField] = useState(0);
  const [cursorPos, setCursorPos] = useState(initialFields[0]?.value.length ?? 0);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.tab && key.shift) {
      setActiveField((prev) => {
        const next = (prev - 1 + fields.length) % fields.length;
        setCursorPos(fields[next].value.length);
        return next;
      });
      return;
    }
    if (key.tab) {
      setActiveField((prev) => {
        const next = (prev + 1) % fields.length;
        setCursorPos(fields[next].value.length);
        return next;
      });
      return;
    }

    if (key.return) {
      const values: Record<string, string> = {};
      for (const f of fields) values[f.name] = f.value;
      onSubmit(values);
      return;
    }

    const field = fields[activeField];
    if (field.type === "priority") {
      if (input === "j" || key.downArrow) {
        const idx = PRIORITIES.indexOf(field.value as Priority);
        const next = PRIORITIES[(idx + 1) % PRIORITIES.length];
        updateField(activeField, next);
      } else if (input === "k" || key.upArrow) {
        const idx = PRIORITIES.indexOf(field.value as Priority);
        const next = PRIORITIES[(idx - 1 + PRIORITIES.length) % PRIORITIES.length];
        updateField(activeField, next);
      }
      return;
    }

    if (field.type === "list" && field.options) {
      if (input === "j" || key.downArrow) {
        const idx = field.options.findIndex((o) => o.value === field.value);
        const next = field.options[(idx + 1) % field.options.length];
        updateField(activeField, next.value);
      } else if (input === "k" || key.upArrow) {
        const idx = field.options.findIndex((o) => o.value === field.value);
        const next = field.options[(idx - 1 + field.options.length) % field.options.length];
        updateField(activeField, next.value);
      }
      return;
    }

    if (field.type === "date") {
      if (key.upArrow) {
        const newVal = shiftDate(field.value, 1);
        updateField(activeField, newVal);
        setCursorPos(newVal.length);
        return;
      } else if (key.downArrow) {
        const newVal = shiftDate(field.value, -1);
        updateField(activeField, newVal);
        setCursorPos(newVal.length);
        return;
      }
    }

    if (key.leftArrow) {
      setCursorPos((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.rightArrow) {
      setCursorPos((prev) => Math.min(field.value.length, prev + 1));
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorPos > 0) {
        updateField(activeField, field.value.slice(0, cursorPos - 1) + field.value.slice(cursorPos));
        setCursorPos((prev) => prev - 1);
      }
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      updateField(activeField, field.value.slice(0, cursorPos) + input + field.value.slice(cursorPos));
      setCursorPos((prev) => prev + input.length);
    }
  });

  function updateField(idx: number, value: string) {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, value } : f)));
  }

  function renderFieldValue(field: Field, isActive: boolean) {
    if (field.type === "priority") {
      return (
        <Text color={field.value === "prioritized" ? theme.priority : undefined}>
          {field.value}
        </Text>
      );
    }
    if (field.type === "list" && field.options) {
      const selected = field.options.find((o) => o.value === field.value);
      return <Text>{selected?.label ?? field.value}</Text>;
    }
    if (field.type === "date") {
      const weekday = getWeekday(field.value);
      if (isActive) {
        const before = field.value.slice(0, cursorPos);
        const under = field.value[cursorPos] ?? " ";
        const after = field.value.slice(cursorPos + 1);
        return (
          <Box>
            <Box><Text>{before}</Text><Text inverse>{under}</Text><Text>{after}</Text></Box>
            {weekday && <Text color={theme.accent}>{"  "}[{weekday}]</Text>}
          </Box>
        );
      }
      return <Box><Text>{field.value}</Text>{weekday && <Text color={theme.accent}>{"  "}[{weekday}]</Text>}</Box>;
    }
    if (isActive) {
      const before = field.value.slice(0, cursorPos);
      const under = field.value[cursorPos] ?? " ";
      const after = field.value.slice(cursorPos + 1);
      return <Box><Text>{before}</Text><Text inverse>{under}</Text><Text>{after}</Text></Box>;
    }
    return <Text>{field.value}</Text>;
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderLeft={false} borderRight={false} borderColor={theme.accent} paddingX={1}>
      <Text bold color={theme.accent}>{title}</Text>
      <Text> </Text>
      {fields.map((field, i) => (
        <Box key={field.name}>
          <Text color={i === activeField ? theme.selection : undefined}>
            {i === activeField ? "❯ " : "  "}
          </Text>
          <Text dimColor>{field.label}: </Text>
          {renderFieldValue(field, i === activeField)}
        </Box>
      ))}
      <Text> </Text>
      <Text dimColor>Tab/Shift+Tab: fields  Enter: submit  Esc: cancel</Text>
    </Box>
  );
}
