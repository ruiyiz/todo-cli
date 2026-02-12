import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.ts";

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  useInput((input, key) => {
    if (input === "y" || input === "Y") onConfirm();
    else if (input === "n" || input === "N" || key.escape) onCancel();
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.selection} paddingX={2} paddingY={1} marginY={1}>
      <Text>{message}</Text>
      <Text dimColor>Press y to confirm, n or Esc to cancel</Text>
    </Box>
  );
}
