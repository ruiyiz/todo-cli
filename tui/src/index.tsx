#!/usr/bin/env bun
import React from "react";
import { render } from "ink";
import { App } from "./app.tsx";
import { getDb, syncDb } from "@core/db/connection.ts";

const enterAltScreen = "\x1b[?1049h";
const leaveAltScreen = "\x1b[?1049l";

process.stdout.write(enterAltScreen + "\x1b[H\x1b[2J");

getDb();
syncDb();

const { waitUntilExit } = render(<App />, { exitOnCtrlC: false });

waitUntilExit().then(() => {
  syncDb();
  process.stdout.write(leaveAltScreen);
});
