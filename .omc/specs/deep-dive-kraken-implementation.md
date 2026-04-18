# Kraken — Implementation Spec

## Goal
Rebuild hesamsheikh/octogent from scratch as "Kraken" — a web-first command surface for running multiple coding agent terminals in parallel. Full MVP: ~160 files across 3 packages with sea-creature themed naming, bottom-up monorepo implementation.

## Constraints
- Zero Octogent references in any file (code, docs, comments, strings)
- TypeScript monorepo with pnpm workspaces (packages/core, apps/api, apps/web)
- Node.js 22+, ESM modules, Biome for linting
- Only 2 root runtime deps: `node-pty`, `ws`
- Binds to 127.0.0.1 by default with loopback security checks
- PTY sessions do not survive API restarts (fundamental constraint)

## Non-Goals
- X/Twitter monitor feature (dropped)
- Mobile apps or native SDKs
- Plugin system (post-MVP)
- MCP server integration (post-MVP)

## Key Decisions

### Naming Convention (Sea-Creature Theme)
| Octogent | Kraken |
|----------|--------|
| tentacle | arm |
| octoboss | captain |
| swarm | fleet |
| deck | command-deck |
| octopus (visual) | kraken (visual) |
| `.octogent/` | `.kraken/` |
| `~/.octogent/` | `~/.kraken/` |
| `@octogent/core` | `@kraken/core` |
| `OCTOGENT_*` env vars | `KRAKEN_*` env vars |

### Agent Providers (3 at launch)
- `claude-code` — primary (spawns `claude` CLI)
- `codex` — secondary (spawns `codex` CLI)
- `gemini-cli` — new addition (spawns `gemini` CLI)

### Persistence: SQLite Hybrid
- **SQLite** for structured runtime data: terminal registry, transcripts, channel messages, conversations, code-intel events
- **File-based** for context: `.kraken/arms/<id>/CONTEXT.md`, `todo.md`, vault files
- **File-based** for prompts: `.kraken/prompts/`
- Benefit: persistent channels (survive restarts), proper queries, single file backup

### Testing: Port All Tests
- Port all ~30 test files from Octogent with renames
- Vitest for both apps/api and apps/web
- Test structure mirrors source structure

### Documentation: Port All Docs
- Port and rename all 12 doc files
- Update all references to Kraken naming
- Rewrite examples with Kraken CLI commands

## Build Sequence

```
Phase 1: packages/core (16 files) — domain types, ports, adapters
Phase 2: Root config (10 files) — package.json, tsconfig, biome, README
Phase 3: apps/api (55 files) — PTY runtime, HTTP/WS server, routes
Phase 4: prompts/ (11 files) — agent prompt templates
Phase 5: apps/web (80 files) — React dashboard
Phase 6: docs/ (12 files) — documentation
```

## Acceptance Criteria
1. `pnpm install` succeeds
2. `pnpm build` compiles all 3 packages without errors
3. `pnpm test` passes all ported tests
4. `pnpm lint` passes Biome checks
5. `kraken` CLI starts the API server, opens browser
6. `kraken init` creates `.kraken/` scaffold
7. Creating an arm (tentacle) produces `.kraken/arms/<id>/CONTEXT.md` + `todo.md`
8. Creating a terminal spawns a real PTY session with `claude` CLI
9. WebSocket streams terminal I/O to the browser
10. Fleet (swarm) spawns worker terminals from todo items
11. Channel messages deliver between terminals
12. Channel messages persist across API restarts (SQLite)
13. Agent state detection works (idle/processing/waiting)
14. Git worktree creation and lifecycle works
15. Conversation transcripts persist and are searchable
16. Dashboard renders: command-deck, canvas, activity, conversations views
17. No string "octogent" appears anywhere in the codebase

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   apps/web                       │
│  React Dashboard (Vite)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │Command   │ │Canvas    │ │Activity          ││
│  │Deck View │ │View      │ │(Terminal Columns)││
│  └──────────┘ └──────────┘ └──────────────────┘│
│         │              │              │          │
│         └──────────────┼──────────────┘          │
│                        │ HTTP + WebSocket        │
└────────────────────────┼────────────────────────┘
                         │
┌────────────────────────┼────────────────────────┐
│                   apps/api                       │
│  ┌─────────────┐  ┌────┴────────┐  ┌──────────┐│
│  │HTTP Routes   │  │WS Upgrade   │  │Hooks     ││
│  │(~40 routes) │  │Handler      │  │Processor ││
│  └──────┬──────┘  └──────┬──────┘  └────┬─────┘│
│         │                │               │      │
│  ┌──────┴────────────────┴───────────────┴────┐ │
│  │         Terminal Runtime                    │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐│ │
│  │  │PTY Mgmt │ │Channels  │ │Worktree Mgr  ││ │
│  │  │(node-pty)│ │(SQLite)  │ │(git worktree)││ │
│  │  └─────────┘ └──────────┘ └──────────────┘│ │
│  └────────────────────────────────────────────┘ │
│                        │                        │
│  ┌─────────────────────┴──────────────────────┐ │
│  │              SQLite Database                │ │
│  │  terminals | transcripts | channels | ...   │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────┐
│               packages/core                      │
│  Domain types | Ports | Adapters | Utils         │
└─────────────────────────────────────────────────┘
```

## Trace Findings
The deep research of hesamsheikh/octogent revealed a sophisticated but clean architecture:
- Only 2 runtime deps (node-pty, ws) — extremely lean
- Ports-and-adapters pattern in packages/core keeps domain pure
- PTY-based terminal management (not API-based) is the unique differentiator
- File-based context (tentacles/arms) is more durable than chat history
- Swarm/fleet pattern with channel messaging enables visible multi-agent work
- Agent state detection via ANSI parsing is clever but fragile
- In-memory channels are the biggest weakness — SQLite fixes this

## File Count Summary
| Package | Files | Tests |
|---------|-------|-------|
| packages/core | 16 | 1 |
| apps/api | 42 | 14 |
| apps/web | 80 | 20 |
| prompts | 11 | — |
| docs | 12 | — |
| root config | 10 | — |
| **Total** | **~171** | **~35** |
