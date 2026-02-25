# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A CLI + TUI todo manager built with Bun, TypeScript, and SQLite. Two separate entry points: `todo` (CLI) and `todo-tui` (interactive TUI).

## Commands

```bash
bun install                  # Install dependencies (root + tui/)
bun link                     # Register 'todo' globally
cd tui && bun link           # Register 'todo-tui' globally

bun src/index.ts             # Run CLI directly
bun tui/src/index.tsx         # Run TUI directly
```

No test framework is configured. No linter is configured.

## Architecture

### Two Applications, Shared Data Layer

- **CLI** (`src/`): Commander.js commands that call the repository and pipe output through formatters.
- **TUI** (`tui/`): Ink (React for terminals) app with its own `package.json`. Imports the CLI's `src/db/` modules directly for data access.

### CLI Layer (`src/`)

`index.ts` → `cli.ts` (registers commands) → `commands/*.ts` (one file per command) → `db/repository.ts` (all SQL) → `db/connection.ts` (SQLite setup).

Each command handler: parse args → validate → call repository → format output via `formatters/`.

### TUI Layer (`tui/src/`)

`index.tsx` → `app.tsx` (useReducer + keyboard input) → views (`views/`) → components (`components/`).

State management follows a Redux pattern: `state.ts` defines `AppState`, `Action` union, and a pure `reducer`. State and dispatch are provided via React context (`context.ts`). Navigation uses a stack-based view model with cursor memory per view.

### Data

- **Database**: SQLite at `~/.local/share/todo/todo.db` (override with `TODO_DB_PATH` env var).
- **Schema** (`db/schema.ts`): `lists` and `todos` tables with auto-migration on startup. An `updated_at` trigger fires on todo updates.
- **`_last_result` table**: Maps numeric indices from the last `show` output to todo UUIDs, enabling `todo edit 1` shorthand.
- **ID resolution** (`utils/id-resolver.ts`): Todos are referenced by numeric index, UUID prefix, or full UUID.

### Key Patterns

- **Priority**: Two-level system (`normal` | `prioritized`). Legacy 4-level values are auto-migrated.
- **Dates**: Stored as `YYYY-MM-DD` strings. Parsed via chrono-node (natural language). Display uses smart relative labels.
- **Output formats**: Three formatters (`pretty`, `plain`, `json`) with the same public API shape.
- **TUI data hooks**: `use-data.ts` and `use-today.ts` fetch from the repository and re-query on `refreshKey` changes.
