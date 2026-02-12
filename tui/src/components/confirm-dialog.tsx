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
    <Box flexDirection="column" borderStyle="single" borderLeft={false} borderRight={false} borderColor={theme.danger} paddingX={1}>
      <Text bold color={theme.danger}>{message}</Text>
      <Text> </Text>
      <Text dimColor>y: confirm  n/Esc: cancel</Text>
    </Box>
  );
}
