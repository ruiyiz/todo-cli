# todo

A fast CLI tool for managing todos, powered by Bun + TypeScript + SQLite.

## Install

```bash
bun install
bun link
```

This makes the `todo` command available globally.

## Usage

```bash
# Show today's todos + overdue (default)
todo

# Add a todo
todo add "Buy milk" --due tomorrow --priority high
todo add "Review PR" --list Work --notes "Check the auth changes"

# Show with filters
todo show today
todo show tomorrow
todo show week
todo show overdue
todo show completed
todo show all
todo show 2025-03-15
todo show --list Work

# Edit a todo (by index, UUID prefix, or full UUID)
todo edit 1 --title "Buy oat milk"
todo edit 1 --due friday --priority medium
todo edit 1 --clear-due
todo edit 1 --complete

# Mark todos complete
todo complete 1 2 3

# Delete todos
todo delete 1 --force
todo delete 1 2 --dry-run

# Manage lists
todo list                        # show all lists
todo list "Work" --create        # create a new list
todo list "Work" --rename "Job"  # rename a list
todo list "Work" --delete --force

# Database info
todo status
```

## Output Formats

```bash
todo show all --json    # JSON output
todo show all --plain   # Tab-separated (for scripting)
todo show all           # Pretty colored output (default)
```

## Global Options

| Flag | Description |
|------|-------------|
| `-j, --json` | Output as JSON |
| `--plain` | Tab-separated plain text |
| `-q, --quiet` | Suppress output |
| `--no-color` | Disable colors |
| `--no-input` | Disable interactive prompts |

## ID Resolution

Todos can be referenced by:

- **Index** — `todo edit 1` (indices from the last `show` result)
- **UUID prefix** — `todo edit 4a83`
- **Full UUID** — `todo edit 4a83b2c1-...`

## Data Storage

Todos are stored in a local SQLite database at `~/.local/share/todo/todo.db`. Override with the `TODO_DB_PATH` environment variable.

## Tech Stack

- [Bun](https://bun.sh) — runtime & SQLite driver
- [Commander](https://github.com/tj/commander.js) — CLI framework
- [chrono-node](https://github.com/wanasit/chrono) — natural language date parsing
- [chalk](https://github.com/chalk/chalk) — terminal colors
