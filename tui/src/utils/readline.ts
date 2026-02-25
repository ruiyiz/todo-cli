type Result = { value: string; cursorPos: number };

export function moveToLineStart(value: string, cursorPos: number): Result {
  const lastNewline = value.slice(0, cursorPos).lastIndexOf("\n");
  return { value, cursorPos: lastNewline === -1 ? 0 : lastNewline + 1 };
}

export function moveToLineEnd(value: string, cursorPos: number): Result {
  const nextNewline = value.slice(cursorPos).indexOf("\n");
  return { value, cursorPos: nextNewline === -1 ? value.length : cursorPos + nextNewline };
}

export function killToLineStart(value: string, cursorPos: number): Result {
  const lastNewline = value.slice(0, cursorPos).lastIndexOf("\n");
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
  return { value: value.slice(0, lineStart) + value.slice(cursorPos), cursorPos: lineStart };
}

export function killToLineEnd(value: string, cursorPos: number): Result {
  const nextNewline = value.slice(cursorPos).indexOf("\n");
  const lineEnd = nextNewline === -1 ? value.length : cursorPos + nextNewline;
  return { value: value.slice(0, cursorPos) + value.slice(lineEnd), cursorPos };
}

export function deleteWordBackward(value: string, cursorPos: number): Result {
  let pos = cursorPos;
  while (pos > 0 && /\s/.test(value[pos - 1])) pos--;
  while (pos > 0 && !/\s/.test(value[pos - 1])) pos--;
  return { value: value.slice(0, pos) + value.slice(cursorPos), cursorPos: pos };
}

export function moveWordBackward(value: string, cursorPos: number): Result {
  let pos = cursorPos;
  while (pos > 0 && /\s/.test(value[pos - 1])) pos--;
  while (pos > 0 && !/\s/.test(value[pos - 1])) pos--;
  return { value, cursorPos: pos };
}

export function moveWordForward(value: string, cursorPos: number): Result {
  let pos = cursorPos;
  while (pos < value.length && /\s/.test(value[pos])) pos++;
  while (pos < value.length && !/\s/.test(value[pos])) pos++;
  return { value, cursorPos: pos };
}
