import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Priority } from "@core/types.ts";
import { theme } from "../theme.ts";
import { shiftDate } from "../utils/date-input.ts";
import { DateFieldDisplay } from "./date-field-display.tsx";
import { moveToLineStart, moveToLineEnd, killToLineStart, killToLineEnd, deleteWordBackward, moveWordBackward, moveWordForward } from "../utils/readline.ts";

interface Field {
  name: string;
  label: string;
  value: string;
  type?: "text" | "priority" | "list" | "date" | "multiline";
  options?: { value: string; label: string }[];
}

interface Props {
  title: string;
  fields: Field[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

const PRIORITIES: Priority[] = ["normal", "prioritized"];

function getLineCol(value: string, cursorPos: number): { line: number; col: number } {
  const before = value.slice(0, cursorPos);
  const lines = before.split("\n");
  return { line: lines.length - 1, col: lines[lines.length - 1].length };
}

function posFromLineCol(value: string, line: number, col: number): number {
  const lines = value.split("\n");
  let pos = 0;
  for (let i = 0; i < line && i < lines.length; i++) {
    pos += lines[i].length + 1;
  }
  const targetLine = lines[Math.min(line, lines.length - 1)];
  return pos + Math.min(col, targetLine.length);
}

export function InputForm({ title, fields: initialFields, onSubmit, onCancel }: Props) {
  const [fields, setFields] = useState(initialFields);
  const [activeField, setActiveField] = useState(0);
  const [cursorPos, setCursorPos] = useState(initialFields[0]?.value.length ?? 0);

  const isMultiline = fields[activeField]?.type === "multiline";

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

    // Ctrl+S: universal submit
    if (key.ctrl && input === "s") {
      const values: Record<string, string> = {};
      for (const f of fields) values[f.name] = f.value;
      onSubmit(values);
      return;
    }

    if (key.return) {
      if (isMultiline) {
        const field = fields[activeField];
        updateField(activeField, field.value.slice(0, cursorPos) + "\n" + field.value.slice(cursorPos));
        setCursorPos((prev) => prev + 1);
      } else {
        const values: Record<string, string> = {};
        for (const f of fields) values[f.name] = f.value;
        onSubmit(values);
      }
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

    // Multiline Up/Down navigation
    if (isMultiline && (key.upArrow || key.downArrow)) {
      const { line, col } = getLineCol(field.value, cursorPos);
      const lines = field.value.split("\n");
      if (key.upArrow && line > 0) {
        setCursorPos(posFromLineCol(field.value, line - 1, col));
      } else if (key.downArrow && line < lines.length - 1) {
        setCursorPos(posFromLineCol(field.value, line + 1, col));
      }
      return;
    }

    if (key.ctrl) {
      let result: { value: string; cursorPos: number } | null = null;
      if (key.leftArrow) result = moveWordBackward(field.value, cursorPos);
      else if (key.rightArrow) result = moveWordForward(field.value, cursorPos);
      else if (input === "u") result = killToLineStart(field.value, cursorPos);
      else if (input === "a") result = moveToLineStart(field.value, cursorPos);
      else if (input === "e") result = moveToLineEnd(field.value, cursorPos);
      else if (input === "k") result = killToLineEnd(field.value, cursorPos);
      else if (input === "w") result = deleteWordBackward(field.value, cursorPos);
      if (result) {
        updateField(activeField, result.value);
        setCursorPos(result.cursorPos);
      }
      return;
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

  function renderMultilineValue(field: Field, isActive: boolean) {
    const lines = field.value.split("\n");
    if (isActive) {
      const { line: curLine, col: curCol } = getLineCol(field.value, cursorPos);
      return (
        <Box flexDirection="column">
          {lines.map((lineText, li) => {
            if (li === curLine) {
              const before = lineText.slice(0, curCol);
              const under = lineText[curCol] ?? " ";
              const after = lineText.slice(curCol + 1);
              return <Text key={li}>{before}<Text inverse>{under}</Text>{after}</Text>;
            }
            return <Text key={li}>{lineText || " "}</Text>;
          })}
        </Box>
      );
    }
    return (
      <Box flexDirection="column">
        {lines.map((lineText, li) => (
          <Text key={li}>{lineText || " "}</Text>
        ))}
      </Box>
    );
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
      return <DateFieldDisplay value={field.value} cursorPos={cursorPos} isActive={isActive} />;
    }
    if (field.type === "multiline") {
      return renderMultilineValue(field, isActive);
    }
    if (isActive) {
      const before = field.value.slice(0, cursorPos);
      const under = field.value[cursorPos] ?? " ";
      const after = field.value.slice(cursorPos + 1);
      return <Box><Text>{before}</Text><Text inverse>{under}</Text><Text>{after}</Text></Box>;
    }
    return <Text>{field.value}</Text>;
  }

  const helpText = isMultiline
    ? "Tab: next field  Ctrl+S: submit  Esc: cancel"
    : "Tab/Shift+Tab: fields  Enter: submit  Esc: cancel";

  return (
    <Box flexDirection="column" borderStyle="single" borderLeft={false} borderRight={false} borderColor={theme.accent} paddingX={1}>
      <Text bold color={theme.accent}>{title}</Text>
      <Text> </Text>
      {fields.map((field, i) => {
        const isActive = i === activeField;
        if (field.type === "multiline") {
          return (
            <Box key={field.name} flexDirection="column">
              <Box>
                <Text color={isActive ? theme.selection : undefined}>
                  {isActive ? "❯ " : "  "}
                </Text>
                <Text dimColor>{field.label}:</Text>
              </Box>
              <Box marginLeft={4}>
                {renderFieldValue(field, isActive)}
              </Box>
            </Box>
          );
        }
        return (
          <Box key={field.name}>
            <Text color={isActive ? theme.selection : undefined}>
              {isActive ? "❯ " : "  "}
            </Text>
            <Text dimColor>{field.label}: </Text>
            {renderFieldValue(field, isActive)}
          </Box>
        );
      })}
      <Text> </Text>
      <Text dimColor>{helpText}</Text>
    </Box>
  );
}
