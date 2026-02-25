#!/usr/bin/env bun
import { createProgram } from "./cli.ts";
import { getDb } from "./db/connection.ts";

getDb();

const program = createProgram();
program.parse();
