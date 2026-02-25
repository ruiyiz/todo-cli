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

## Sync (Turso)

The CLI and TUI support cross-device sync via a [Turso](https://turso.tech) remote database. The local file acts as an embedded replica — reads are always local and fast.

### Setting up sync on a new machine

**1. Get your credentials from the machine that already has sync configured:**

```bash
cat ~/.config/todo/config.json
```

**2. Create the config file on the new machine:**

```bash
mkdir -p ~/.config/todo
cat > ~/.config/todo/config.json << 'EOF'
{
  "turso": {
    "url": "libsql://your-db-name-username.turso.io",
    "authToken": "your-token-here"
  }
}
EOF
```

**3. Pull the database from the remote:**

```bash
todo sync
```

That's it. The local replica is created and populated from the remote.

### How sync works

- `todo sync` — explicit pull/push from the CLI
- `todo-tui` — syncs automatically on open (pull) and close (push)
- All other CLI commands read from the local replica with no network round-trip

### Creating a new Turso database (first-time setup)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

turso auth login
turso db create todo
turso db show todo --url      # → url
turso db tokens create todo   # → authToken
```

## Tech Stack

- [Bun](https://bun.sh) — runtime & SQLite driver
- [Commander](https://github.com/tj/commander.js) — CLI framework
- [chrono-node](https://github.com/wanasit/chrono) — natural language date parsing
- [chalk](https://github.com/chalk/chalk) — terminal colors
