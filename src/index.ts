#!/usr/bin/env bun
import { createProgram } from "./cli.ts";
import { getDb, syncDb } from "./db/connection.ts";

getDb();
syncDb();

const program = createProgram();
program.parse();
