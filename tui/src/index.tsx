#!/usr/bin/env bun
import React from "react";
import { render } from "ink";
import { App } from "./app.tsx";

const enterAltScreen = "\x1b[?1049h";
const leaveAltScreen = "\x1b[?1049l";

process.stdout.write(enterAltScreen + "\x1b[H\x1b[2J");

const { waitUntilExit } = render(<App />);

waitUntilExit().then(() => {
  process.stdout.write(leaveAltScreen);
});
