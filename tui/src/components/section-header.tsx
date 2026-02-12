import React from "react";
import { Box, Text } from "ink";

export function SectionHeader({ label, count, color }: { label: string; count: number; color?: string }) {
  return (
    <Box>
      <Text bold color={color as any}>{label} ({count})</Text>
    </Box>
  );
}
