# Octogent Deep Research Report
## Source: https://github.com/hesamsheikh/octogent
## Date: 2026-04-17

---

## 1. WHAT OCTOGENT IS

Octogent is a **web-first command surface for running multiple Claude Code sessions in parallel**. It is NOT an autonomous agent system — it's an orchestration layer on top of Claude Code that solves a specific problem: **managing 10 Claude Code terminals at once is chaos**.

Tagline: *"too many terminals, not enough tentacles"*

### The Core Problem Solved
When you have many Claude Code sessions open simultaneously (documentation, database, API, frontend), you lose track of what each is doing. Octogent fixes this by giving each job:
- Its own **scoped context** (CONTEXT.md)
- Its own **task list** (todo.md)
- Its own **notes and handoff files**
- A visual **dashboard** to monitor everything

### What It Is NOT
- NOT an LLM wrapper or autonomous agent framework
- NOT an alternative to Claude Code — it sits ON TOP of it
- NOT an API-based AI system — it manages real PTY terminal sessions

---

## 2. ARCHITECTURE

### Monorepo Structure (pnpm workspaces)
```
packages/core/     — Framework-agnostic domain types (ports & adapters)
apps/api/          — Node.js HTTP/WS server, PTY runtime, worktree lifecycle
apps/web/          — Vite + React dashboard UI
```

### Tech Stack
- TypeScript 5.8, Node.js 22+, ESM
- **node-pty** for terminal sessions (real PTY, not child_process)
- **ws** for WebSocket terminal streaming
- **Vite + React** for the web dashboard
- **Biome** for linting/formatting (not ESLint)
- pnpm workspaces, Vitest for tests
- No database — file-based persistence (JSON, JSONL)
- No external dependencies beyond node-pty and ws

### Persistence Model
- `.octogent/` — project-local scaffold
- `.octogent/tentacles/<id>/` — tentacle context folders
- `.octogent/worktrees/<id>/` — git worktrees for isolated terminals
- `~/.octogent/projects/<project-id>/state/` — runtime state, transcripts, monitor cache
- Transcripts stored as `.jsonl` files
- UI state persisted via API (not browser storage)

---

## 3. THE TENTACLE MODEL (Core Abstraction)

A **tentacle** = a folder under `.octogent/tentacles/<tentacle-id>/` containing:
- `CONTEXT.md` — what this area owns, important files, constraints, what not to break
- `todo.md` — markdown checkbox items (parsed by runtime, shown in UI)
- Additional `.md` files — notes, architecture, handoff docs

### Key Insight
Tentacles are NOT tasks. They are **context layers** — durable, file-based scope definitions that survive across sessions. An agent reads the tentacle files before doing work, uses the todo list as a work queue, and updates files as it progresses.

### Tentacles vs Worktrees
- Tentacle = **what the job is about** (context)
- Worktree = **where the code changes happen** (git isolation)
- A tentacle can run in "shared" mode (same workspace) or "worktree" mode (isolated git checkout)

### Tentacle Properties (DeckTentacleSummary)
```typescript
{
  tentacleId: string;
  displayName: string;
  description: string;
  status: "idle" | "active" | "blocked" | "needs-review";
  color: string | null;
  octopus: { animation, expression, accessory, hairColor };
  scope: { paths: string[]; tags: string[] };
  vaultFiles: string[];
  todoTotal: number;
  todoDone: number;
  todoItems: { text: string; done: boolean }[];
  suggestedSkills: string[];
}
```

---

## 4. TERMINAL RUNTIME (PTY Session Management)

This is the most technically interesting part — it manages real PTY terminal sessions.

### Terminal Lifecycle
1. Create terminal → spawn PTY process (via node-pty)
2. Bootstrap with `claude` command (or `codex`)
3. Stream I/O over WebSocket to the browser
4. Track agent state via ANSI output parsing
5. Persist transcripts to JSONL files
6. Handle idle grace period (5 min) for browser reconnects
7. Cleanup on delete/exit

### Agent State Detection
```typescript
type AgentRuntimeState = "idle" | "processing" | "waiting_for_permission" | "waiting_for_user";
```
Detected by parsing ANSI-stripped PTY output for patterns like "esc to interrupt" (= processing).

### Terminal Snapshot
```typescript
{
  terminalId: string;
  label: string;
  state: "live" | "idle" | "queued" | "blocked";
  tentacleId: string;
  workspaceMode: "shared" | "worktree";
  parentTerminalId?: string;  // for child agents
  agentRuntimeState?: AgentRuntimeState;
}
```

### Key Constants
- Idle grace: 5 minutes
- Scrollback buffer: 512 KB max
- Inactivity threshold: 2 days
- Default API port: 8787
- Worktree branch prefix: `octogent/`

---

## 5. SWARM / CHILD AGENT ORCHESTRATION

### Parent-Worker Pattern
1. Developer defines a tentacle with todos
2. "Swarm" action creates one worker terminal per incomplete todo item
3. Parent coordinator terminal supervises all workers
4. Workers report DONE or BLOCKED via channel messages
5. Parent reviews, unblocks, and merges results

### Swarm Parent Prompt Key Instructions
- NEVER do the workers' tasks yourself
- NEVER merge a branch you haven't reviewed the diff for
- NEVER declare swarm complete while any worker is BLOCKED
- Hard limit on children per parent (configurable `maxChildrenPerParent`)

### Swarm Worker Prompt Key Instructions
- Complete ONLY the assigned todo item (no scope creep)
- Run tests before declaring done
- Report BLOCKED with specific details (not "I'm stuck")

### Inter-Agent Messaging (Channels)
- In-memory message queues per terminal
- Messages delivered as prompt injection when target is idle
- Format: `[Channel message from terminal-1]: your message`
- DO NOT persist across API restarts

---

## 6. PROMPT SYSTEM (11 Prompt Templates)

| Prompt | Purpose |
|--------|---------|
| `meta-prompt-generator` | Interactive prompt engineering specialist (7-layer architecture) |
| `octoboss-clean-contexts` | Audit and trim tentacle context files |
| `octoboss-reorganize-tentacles` | Restructure tentacle organization |
| `octoboss-reorganize-todos` | Cross-tentacle todo audit and rebalancing |
| `sandbox-init` | Bootstrap agent into tentacle context |
| `swarm-parent` | Parent coordinator for parallel workers |
| `swarm-worker` | Individual worker executing one todo item |
| `tentacle-context-init` | Initialize agent with tentacle context |
| `tentacle-planner` | Analyze codebase and propose tentacle departments |
| `tentacle-reorganize-todos` | Single-tentacle todo cleanup |
| `tentacle-update-tentacle` | Update tentacle files after work |

### The "Octoboss" Role
Cross-tentacle orchestrator that audits the overall system — cleans contexts, reorganizes tentacles, rebalances todos. Think of it as the manager of managers.

---

## 7. API SURFACE

### REST Endpoints (~40 routes)

**Terminals**: CRUD, snapshots, delete
**Deck/Tentacles**: list, create, delete, update skills, todo CRUD, swarm spawn
**Git**: status, commit, push, sync, PR read/merge (per-tentacle worktree)
**Prompts**: CRUD for prompt templates
**Channels**: send/list messages
**Code Intel**: event recording and retrieval
**Hooks**: Claude Code lifecycle ingestion (session-start, pre-tool-use, stop, etc.)
**Usage**: Claude usage, Codex usage, GitHub summary, usage heatmap
**Monitor**: X/Twitter feed monitoring (experimental)
**Conversations**: list, search, read, export, delete
**UI State**: persist/read layout preferences
**Setup**: workspace initialization wizard

### WebSocket
- `WS /api/terminals/:terminalId/ws` — live terminal I/O streaming
- Upgrade handler with loopback security checks

### Security
- Binds to 127.0.0.1 by default
- Loopback Host/Origin checks
- Remote access requires explicit `OCTOGENT_ALLOW_REMOTE_ACCESS=1`
- JSON body capped at 1 MiB

---

## 8. WEB DASHBOARD (React + Vite)

### Views
1. **Deck View** — Tentacle cards with octopus avatars, todo progress, action buttons
2. **Canvas View** — Force-directed graph visualization of octopus + tentacles
3. **Activity View** — Terminal columns with live PTY output
4. **Conversations View** — Session history, search, export
5. **Code Intel View** — Arc diagram + treemap of tool usage
6. **GitHub View** — Repo summary, commits, PR metrics
7. **Monitor View** — X/Twitter mentions feed
8. **Prompts View** — Prompt library browser/editor
9. **Settings View** — UI preferences, sound settings
10. **Usage Heatmap** — Claude/Codex usage visualization

### Key UI Patterns
- Polling-based data fetching (not push)
- Terminal rendering via xterm.js-style approach
- Notification sounds on terminal completion (6 options)
- Keyboard shortcuts (hotkeys)
- Sidebar with active agents list
- Runtime status strip
- Telemetry tape

### The Octopus Visual
Each tentacle has an `octopus` appearance:
```typescript
{ animation, expression ("normal"|"happy"|"angry"|"surprised"|"sleepy"), accessory, hairColor }
```

---

## 9. DOMAIN MODEL (packages/core)

Clean ports-and-adapters architecture:
- `domain/` — Pure types (terminal, deck, channel, conversation, git, monitor, setup, uiState, usage, agentRuntime, completionSound)
- `ports/` — `TerminalSnapshotReader` interface
- `adapters/` — `InMemoryTerminalSnapshotReader`
- `application/` — `buildTerminalList` (sorting logic)
- `util/` — `typeCoercion` (asRecord, asString, asNumber)

### Agent Providers
```typescript
type TerminalAgentProvider = "codex" | "claude-code";
```
Currently supports Claude Code and Codex as terminal backends.

---

## 10. EXPERIMENTAL / SECONDARY FEATURES

These exist but are explicitly marked as non-core:
- **Monitor** — X/Twitter API feed tracking
- **Code Intel** — Tool usage tracking and visualization
- **Usage Views** — Claude and Codex quota monitoring
- **GitHub Summary** — Repo metrics via `gh` CLI
- **Conversation Export** — JSON/Markdown export

---

## 11. WHAT MAKES THIS UNIQUE (vs Competitors)

| Feature | Octogent | Claude Code Native | Aider | OpenHands |
|---------|----------|-------------------|-------|-----------|
| Multiple parallel terminals | ✅ Real PTY sessions | ✅ Subagents (hidden) | ❌ Single | ✅ Sandboxed |
| Visual dashboard | ✅ Full React UI | ❌ CLI only | ❌ CLI only | ✅ Web UI |
| Scoped context files | ✅ Tentacles | ❌ CLAUDE.md only | ❌ | ❌ |
| Todo-driven delegation | ✅ Swarm from todos | ❌ | ❌ | ❌ |
| Inter-agent messaging | ✅ Channels | ✅ SendMessage | ❌ | ❌ |
| Git worktree isolation | ✅ Per-tentacle | ✅ EnterWorktree | ❌ | ✅ |
| Visible agent work | ✅ See each terminal | ❌ Hidden subagents | ❌ | ✅ |
| Conversation history | ✅ Search/export | ❌ | ❌ | ✅ |

**Unique value**: The only tool that gives you a visual command surface over multiple Claude Code PTY sessions with scoped context, todo-driven delegation, and inter-agent messaging — while keeping every agent's work visible.

---

## 12. REBUILD PLAN FOR KRAKEN

### What to Keep (Core Value)
1. **Tentacle model** — scoped context folders with CONTEXT.md + todo.md
2. **PTY terminal management** — real node-pty sessions with WebSocket streaming
3. **Swarm orchestration** — parent-worker pattern with channel messaging
4. **Web dashboard** — React UI with deck, canvas, and activity views
5. **Agent state detection** — ANSI parsing for idle/processing/waiting states
6. **Worktree isolation** — per-tentacle git worktrees
7. **Prompt system** — template-based agent prompts
8. **Conversation tracking** — transcript persistence and search
9. **Monorepo architecture** — core/api/web separation

### What to Upgrade
1. **Rename everything** — octogent → kraken, tentacle → arm/limb/thread, octoboss → captain
2. **Add more agent providers** — beyond claude-code and codex (Gemini CLI, local agents)
3. **Persistent channels** — messages should survive restarts (use JSONL)
4. **Better state management** — consider SQLite for runtime state instead of scattered JSON files
5. **Hook system expansion** — more Claude Code lifecycle hooks
6. **MCP integration** — expose Kraken as an MCP server
7. **Improved security** — API key auth option, encrypted state
8. **Plugin system** — let users add custom tools/views

### What to Drop
1. X/Twitter monitor (experimental, tangential)
2. Codex usage tracking (Codex is being deprecated)
3. GitHub summary (nice-to-have, not core)

### Naming Map
| Octogent | Kraken (proposed) |
|----------|-------------------|
| octogent | kraken |
| tentacle | arm |
| octoboss | captain |
| deck | command-deck |
| swarm | fleet |
| octopus (visual) | kraken (visual) |
| `.octogent/` | `.kraken/` |
| `~/.octogent/` | `~/.kraken/` |

### Estimated Scope
- ~160 TypeScript source files across 3 packages
- ~50 React components
- ~40 API routes
- 11 prompt templates
- Full test suite (~30 test files)

---

## 13. DEPENDENCIES TO KEEP

**Runtime**: `node-pty`, `ws`
**Dev**: `typescript`, `vitest`, `@biomejs/biome`, `vite`
**Web**: React, Vite (already in apps/web)

That's it — the dependency footprint is remarkably small (only 2 runtime deps at root level).

---

## 14. FILES READ FOR THIS RESEARCH

Every `.ts`, `.md`, `.json`, `.yml` file in the repository was read, totaling ~160 files across:
- `packages/core/src/` (16 files)
- `apps/api/src/` (~50 files)
- `apps/web/src/` (~80 files — components, hooks, runtime)
- `docs/` (12 files)
- `prompts/` (11 files)
- Root configs (8 files)
