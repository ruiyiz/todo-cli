import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface Props {
  label: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function InlineInput({ label, initialValue = "", onSubmit, onCancel }: Props) {
  const [value, setValue] = useState(initialValue);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      onSubmit(value);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1));
      return;
    }
    if (input && !key.ctrl && !key.meta && !key.tab) {
      setValue((prev) => prev + input);
    }
  });

  return (
    <Box marginY={1} paddingX={1}>
      <Text color="cyan" bold>{label}: </Text>
      <Text>{value}</Text>
      <Text dimColor>█</Text>
      <Text>  </Text>
      <Text dimColor>Enter confirm  Esc cancel</Text>
    </Box>
  );
}
