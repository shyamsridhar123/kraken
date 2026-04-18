# API Reference

Kraken exposes a local HTTP and WebSocket API.

## Terminals

- `GET /api/terminal-snapshots` - returns the current terminal list and snapshot state for the UI
- `POST /api/terminals` - creates a new terminal session
- `PATCH /api/terminals/:terminalId` - updates terminal metadata such as the display name
- `DELETE /api/terminals/:terminalId` - removes a terminal and closes its active session
- `WS /api/terminals/:terminalId/ws` - streams live terminal IO over WebSocket

## Git and worktrees

- `GET /api/arms/:armId/git/status` - reads git status for a worktree-backed arm
- `POST /api/arms/:armId/git/commit` - creates a commit from the arm worktree
- `POST /api/arms/:armId/git/push` - pushes the arm branch
- `POST /api/arms/:armId/git/sync` - syncs the arm worktree with its base branch
- `GET /api/arms/:armId/git/pr` - reads pull request information for the arm branch
- `POST /api/arms/:armId/git/pr/merge` - merges the arm pull request

## Command-Deck and arms

- `GET /api/command-deck/skills` - lists available Claude Code skills discovered from project-local `.claude/skills/<skill>/SKILL.md` entries
- `GET /api/command-deck/arms` - lists arms with metadata, vault files, and todo progress
- `POST /api/command-deck/arms` - creates a new arm
- `DELETE /api/command-deck/arms/:armId` - deletes a arm and its stored files
- `PATCH /api/command-deck/arms/:armId/skills` - updates the arm's suggested Claude Code skills and rewrites the managed block in `CONTEXT.md`
- `POST /api/command-deck/arms/:armId/todo` - adds a todo item to `todo.md`
- `PATCH /api/command-deck/arms/:armId/todo/toggle` - marks a todo item done or undone
- `PATCH /api/command-deck/arms/:armId/todo/edit` - edits the text of a todo item
- `POST /api/command-deck/arms/:armId/todo/delete` - deletes a todo item
- `GET /api/command-deck/arms/:armId/files/:filename` - reads one markdown file from the arm vault
- `POST /api/command-deck/arms/:armId/fleet` - spawns worker terminals from incomplete todo items

## Prompts

- `GET /api/prompts` - lists available prompt templates
- `POST /api/prompts` - creates a user prompt
- `GET /api/prompts/:promptId` - reads one prompt
- `PUT /api/prompts/:promptId` - updates one prompt
- `DELETE /api/prompts/:promptId` - deletes one prompt

## Channels

- `GET /api/channels/:terminalId/messages` - lists messages for one terminal channel
- `POST /api/channels/:terminalId/messages` - sends a message to one terminal channel

## Code intel

- `POST /api/code-intel/events` - records one code-intel event
- `GET /api/code-intel/events` - returns the stored code-intel event log

## Hooks

- `POST /api/hooks/:hookName` - ingests lifecycle events coming from Claude Code hooks

Current hook names:

- `session-start`
- `user-prompt-submit`
- `pre-tool-use`
- `notification`
- `stop`

## Usage and telemetry

- `GET /api/codex/usage` - returns Codex usage data when available
- `GET /api/claude/usage` - returns Claude usage data when available
- `GET /api/github/summary` - returns GitHub summary and repo telemetry data
- `GET /api/analytics/usage-heatmap?scope=all|project` - returns heatmap data from Claude session history

## UI state

- `GET /api/ui-state` - reads the persisted UI state for the current project
- `PATCH /api/ui-state` - updates the persisted UI state

## Workspace setup

- `GET /api/setup` - reads the verified first-run setup status for the current workspace
- `POST /api/setup/steps/:stepId` - runs one setup step and returns the refreshed setup snapshot

## Monitor

- `GET /api/monitor/config` - reads monitor configuration
- `PATCH /api/monitor/config` - updates monitor configuration
- `GET /api/monitor/feed` - returns the current monitor feed snapshot
- `POST /api/monitor/refresh` - forces a monitor refresh

## Conversations

- `GET /api/conversations` - lists stored conversations
- `DELETE /api/conversations` - deletes all stored conversations
- `GET /api/conversations/search?q=...` - searches conversations by text
- `GET /api/conversations/:sessionId` - reads one conversation in full
- `GET /api/conversations/:sessionId/export?format=json|md` - exports one conversation as JSON or Markdown

## Request limits and defaults

- JSON request bodies are capped at `1 MiB`
- invalid JSON returns `400`
- unsupported methods return `405`
- the server binds to loopback by default
