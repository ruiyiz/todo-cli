import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Priority } from "@core/types.ts";

interface Field {
  name: string;
  label: string;
  value: string;
  type?: "text" | "priority";
}

interface Props {
  title: string;
  fields: Field[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

const PRIORITIES: Priority[] = ["normal", "prioritized"];

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
          {field.type === "priority" ? (
            <Text color={field.value === "prioritized" ? "yellow" : undefined}>
              {field.value}
            </Text>
          ) : (
            <Text>{field.value}<Text dimColor>{i === activeField ? "█" : ""}</Text></Text>
          )}
        </Box>
      ))}
      <Text> </Text>
      <Text dimColor>Tab/Shift+Tab: fields  Enter: submit  Esc: cancel</Text>
    </Box>
  );
}
