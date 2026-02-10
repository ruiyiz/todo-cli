import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Priority } from "@core/types.ts";

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

function shiftDate(value: string, delta: number): string {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  let d: Date;
  if (!value || !dateRegex.test(value)) {
    d = new Date();
  } else {
    d = new Date(value + "T00:00:00");
  }
  d.setDate(d.getDate() + delta);
  return localDateStr(d);
}

export function InputForm({ title, fields: initialFields, onSubmit, onCancel }: Props) {
  const [fields, setFields] = useState(initialFields);
  const [activeField, setActiveField] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.tab && key.shift) {
      setActiveField((prev) => (prev - 1 + fields.length) % fields.length);
      return;
    }
    if (key.tab) {
      setActiveField((prev) => (prev + 1) % fields.length);
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
        updateField(activeField, shiftDate(field.value, 1));
        return;
      } else if (key.downArrow) {
        updateField(activeField, shiftDate(field.value, -1));
        return;
      }
    }

    if (key.backspace || key.delete) {
      updateField(activeField, field.value.slice(0, -1));
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      updateField(activeField, field.value + input);
    }
  });

  function updateField(idx: number, value: string) {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, value } : f)));
  }

  function renderFieldValue(field: Field, isActive: boolean) {
    if (field.type === "priority") {
      return (
        <Text color={field.value === "prioritized" ? "yellow" : undefined}>
          {field.value}
        </Text>
      );
    }
    if (field.type === "list" && field.options) {
      const selected = field.options.find((o) => o.value === field.value);
      return <Text>{selected?.label ?? field.value}</Text>;
    }
    return (
      <Text>{field.value}<Text dimColor>{isActive ? "█" : ""}</Text></Text>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1} marginY={1}>
      <Text bold color="cyan">{title}</Text>
      <Text> </Text>
      {fields.map((field, i) => (
        <Box key={field.name}>
          <Text color={i === activeField ? "yellow" : undefined}>
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
