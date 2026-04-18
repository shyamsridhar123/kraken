# CLI Reference

## Start the dashboard

```bash
kraken
```

Starts the local API for the current project and opens the UI when bundled web assets are present.

If the current directory has not been initialized yet, `kraken` also creates or updates the local `.kraken/` scaffold automatically on first run.

## Initialize a project

```bash
kraken init [project-name]
```

Creates or updates the `.kraken/` scaffold in the current directory without starting the dashboard.

Use this when you want to initialize the project explicitly or set the project display name ahead of time. In normal use, running `kraken` inside the codebase is enough to initialize and start the app.

## List registered projects

```bash
kraken projects
```

## Create a arm

```bash
kraken arm create <name> --description "API runtime and routes"
```

Kraken must already be running for this command.

## List arms

```bash
kraken arm list
```

## Create a terminal

```bash
kraken terminal create [options]
```

Options:

- `--name`, `-n`: terminal display name
- `--workspace-mode`, `-w`: `shared` or `worktree`
- `--initial-prompt`, `-p`: raw initial prompt text
- `--terminal-id`: explicit terminal ID
- `--arm-id`: existing arm ID to attach to
- `--worktree-id`: explicit worktree ID
- `--parent-terminal-id`: parent terminal ID for child terminals
- `--prompt-template`: prompt template name
- `--prompt-variables`: JSON object of prompt template variables

## Send a message

```bash
kraken channel send <terminal-id> "message"
```

## List messages

```bash
kraken channel list <terminal-id>
```
