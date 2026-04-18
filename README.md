# Kraken

> too many terminals, not enough arms

**Kraken** is a web-first command surface for running multiple AI coding agents in parallel. It gives each job its own scoped context, task list, and notes — then lets you monitor, coordinate, and orchestrate everything from a single dashboard.

## The Problem

You've got ten Claude Code sessions open. One is doing docs. Another is touching the database. A third is somewhere in the API layer. A fourth is deep in the frontend. You're tab-switching constantly, losing track of what each one is doing, and context is bleeding everywhere.

**Kraken fixes that.**

## What It Does

- **Arms as context layers** — each slice of work gets its own `CONTEXT.md`, `todo.md`, and notes folder. Agents read these files instead of depending on messy chat history.
- **Parallel terminal sessions** — run multiple Claude Code (or Codex, or Gemini) terminals at once, each visible and controllable from the dashboard.
- **Fleet orchestration** — spawn worker agents from todo items. A captain coordinates, workers report DONE or BLOCKED, and you merge the results.
- **Inter-agent messaging** — agents can send short coordination messages to each other through channels.
- **Git worktree isolation** — each arm can get its own git worktree so parallel agents don't step on each other's code.
- **Real PTY sessions** — these aren't hidden background agents. Every terminal is a real, visible session you can see, interact with, and interrupt.
- **Web dashboard** — command deck view, canvas visualization, activity monitor, conversation history, and more.

## Quick Start

```bash
pnpm install
pnpm dev
```

On first run, Kraken creates the local `.kraken/` scaffold, picks an available port starting at 8787, and opens the dashboard.

## Requirements

- Node.js 22+
- `claude` for Claude Code workflow
- `git` for worktree terminals
- `gh` for GitHub PR features

## Supported Agents

| Provider | Command | Status |
|----------|---------|--------|
| Claude Code | `claude` | Primary |
| Codex | `codex` | Supported |
| Gemini CLI | `gemini` | Supported |

## Architecture

```
packages/core/     — Framework-agnostic domain types (ports & adapters)
apps/api/          — Node.js HTTP/WS server, PTY runtime, worktree lifecycle
apps/web/          — Vite + React dashboard
```

Only two runtime dependencies: `node-pty` and `ws`. Everything else is dev tooling.

## Key Concepts

| Concept | What It Is |
|---------|-----------|
| **Arm** | A scoped context folder (`CONTEXT.md` + `todo.md`) for one slice of work |
| **Terminal** | A live PTY session running a coding agent |
| **Fleet** | A swarm of worker terminals spawned from todo items |
| **Captain** | The coordinator agent that supervises a fleet |
| **Channel** | A messaging path between terminals |

## What Persists

- `.kraken/` — project-local scaffold, arm context files, worktrees
- `~/.kraken/` — runtime state, transcripts, conversation history

PTY sessions survive browser reloads but not API restarts.

## Docs

- [Installation](docs/getting-started/installation.md)
- [Quickstart](docs/getting-started/quickstart.md)
- [Mental Model](docs/concepts/mental-model.md)
- [Arms](docs/concepts/arms.md)
- [Runtime and API](docs/concepts/runtime-and-api.md)
- [Working With Todos](docs/guides/working-with-todos.md)
- [Orchestrating Child Agents](docs/guides/orchestrating-child-agents.md)
- [Inter-Agent Messaging](docs/guides/inter-agent-messaging.md)
- [CLI Reference](docs/reference/cli.md)
- [API Reference](docs/reference/api.md)

## License

MIT
