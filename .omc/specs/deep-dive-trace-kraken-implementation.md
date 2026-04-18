# Deep Dive Trace: Kraken Implementation

## Observed Result
We need to rebuild hesamsheikh/octogent from scratch as "Kraken" — a full MVP (~160 files) using a bottom-up monorepo strategy with sea-creature themed naming.

## Strategy: Bottom-Up Monorepo

### Phase 1: Foundation (`packages/core`) — ~16 files
Domain types first. No React, no HTTP, no PTY — pure TypeScript interfaces and types.

**Rename map applied throughout:**
| Octogent | Kraken |
|----------|--------|
| tentacle | arm |
| octoboss | captain |
| swarm | fleet |
| deck | command-deck |
| octopus | kraken |
| `.octogent/` | `.kraken/` |
| `~/.octogent/` | `~/.kraken/` |
| `@octogent/core` | `@kraken/core` |

**Files:**
1. `packages/core/package.json`
2. `packages/core/tsconfig.json`
3. `packages/core/src/index.ts` — barrel export
4. `packages/core/src/domain/terminal.ts` — TerminalSnapshot, AgentState, ArmWorkspaceMode
5. `packages/core/src/domain/agentRuntime.ts` — AgentRuntimeState, TerminalAgentProvider
6. `packages/core/src/domain/commandDeck.ts` — ArmSummary, ArmStatus, KrakenAppearance
7. `packages/core/src/domain/channel.ts` — ChannelMessage
8. `packages/core/src/domain/completionSound.ts` — sound IDs
9. `packages/core/src/domain/conversation.ts` — turns, events, search
10. `packages/core/src/domain/git.ts` — git status, PR snapshots
11. `packages/core/src/domain/monitor.ts` — (stub, minimal)
12. `packages/core/src/domain/setup.ts` — workspace setup steps
13. `packages/core/src/domain/uiState.ts` — persisted UI preferences
14. `packages/core/src/domain/usage.ts` — Claude/Codex usage snapshots
15. `packages/core/src/ports/TerminalSnapshotReader.ts` — interface
16. `packages/core/src/adapters/InMemoryTerminalSnapshotReader.ts`
17. `packages/core/src/application/buildTerminalList.ts`
18. `packages/core/src/util/typeCoercion.ts`

### Phase 2: API Server (`apps/api`) — ~55 files
The PTY runtime, HTTP/WS server, and all route handlers.

**Terminal Runtime (~12 files):**
1. `terminalRuntime/types.ts` — PersistedTerminal, TerminalSession, GitClient
2. `terminalRuntime/constants.ts` — IDs, paths, timeouts (renamed)
3. `terminalRuntime/registry.ts` — terminal persistence and lifecycle
4. `terminalRuntime/sessionRuntime.ts` — PTY spawn, I/O, state tracking
5. `terminalRuntime/protocol.ts` — WebSocket upgrade, terminal streaming
6. `terminalRuntime/channelMessaging.ts` — inter-agent message system
7. `terminalRuntime/conversations.ts` — transcript persistence
8. `terminalRuntime/claudeTranscript.ts` — Claude JSONL transcript parser
9. `terminalRuntime/hookProcessor.ts` — Claude Code hook ingestion
10. `terminalRuntime/ptyEnvironment.ts` — PTY env configuration
11. `terminalRuntime/worktreeManager.ts` — git worktree lifecycle
12. `terminalRuntime/gitOperations.ts` — git status, commit, push, PR

**API Routes (~12 files):**
1. `createApiServer/requestHandler.ts` — main request router
2. `createApiServer/routeHelpers.ts` — JSON helpers, CORS, auth
3. `createApiServer/security.ts` — loopback checks
4. `createApiServer/types.ts` — route handler types
5. `createApiServer/terminalRoutes.ts` — CRUD terminals
6. `createApiServer/terminalParsers.ts` — request parsing
7. `createApiServer/deckRoutes.ts` → `commandDeckRoutes.ts` — arms, todos, fleet
8. `createApiServer/gitRoutes.ts` — worktree git ops
9. `createApiServer/gitParsers.ts`
10. `createApiServer/conversationRoutes.ts` — search, export
11. `createApiServer/miscRoutes.ts` — prompts, channels, hooks, usage
12. `createApiServer/upgradeHandler.ts` — WebSocket upgrade

**Top-level API files (~15 files):**
1. `server.ts` — entry point, bootstrap
2. `cli.ts` — CLI argument parsing
3. `createApiServer.ts` — server factory
4. `agentStateDetection.ts` — ANSI parsing for agent state
5. `claudeSessionScanner.ts` — find Claude sessions
6. `claudeSkills.ts` — discover Claude Code skills
7. `claudeUsage.ts` — parse Claude usage
8. `codexUsage.ts` — parse Codex usage (stub)
9. `codeIntelStore.ts` — tool usage tracking
10. `githubRepoSummary.ts` — gh CLI integration
11. `logging.ts` — logger
12. `projectPersistence.ts` — project ID, scaffold
13. `runtimeMetadata.ts` — version, paths
14. `setupState.ts` — first-run wizard state
15. `setupStatus.ts` — prerequisite checks
16. `startupPrerequisites.ts` — validate claude, git, etc.

**Prompt system (~3 files):**
1. `prompts/index.ts` — prompt registry
2. `prompts/promptResolver.ts` — template rendering

**Config + tests:**
1. `apps/api/package.json`
2. `apps/api/tsconfig.json`
3. `apps/api/AGENTS.md`
4. `apps/api/vitest.config.ts`
5. Tests (~14 test files)

### Phase 3: Web Dashboard (`apps/web`) — ~80 files
React + Vite dashboard with all views.

**Core app files (~20 files):**
- App.tsx, main.tsx
- Hooks: useAgentRuntimeStates, useConversationsRuntime, useTerminalMutations, useTerminalStateReconciliation, useWorkspaceSetup, useMonitorRuntime, useCodeIntelRuntime, useGithubSummaryPolling, useClaudeUsagePolling, usePersistedUiState, etc.
- State: terminalRuntimeStateStore, terminalState
- Normalizers: conversationNormalizers, githubNormalizers, monitorNormalizers, uiStateNormalizers, usageNormalizers
- Runtime: HttpTerminalSnapshotReader, runtimeEndpoints

**Components (~50 files):**
- Primary views: CommandDeckPrimaryView, CanvasPrimaryView, ActivityPrimaryView, ConversationsPrimaryView, CodeIntelPrimaryView, GitHubPrimaryView, MonitorPrimaryView, PromptsPrimaryView, SettingsPrimaryView
- Command deck: ArmPod, AddArmForm, DeckBottomActions, WorkspaceSetupCard, krakenVisuals
- Canvas: CanvasArmPanel, CanvasTerminalColumn, KrakenNode, SessionNode
- Terminal: Terminal, TerminalPromptPicker, terminalReplay, terminalWheel
- UI primitives: ActionButton, ConfirmationDialog, MarkdownContent, SettingsToggle, StatusBadge
- Navigation: ConsolePrimaryNav, PrimaryViewRouter, ActiveAgentsSidebar, SidebarActionPanel, SidebarConversationsList, SidebarPromptsList
- Monitoring: TelemetryTape, RuntimeStatusStrip, UsageHeatmap, CodeIntelArcDiagram, CodeIntelTreemap

### Phase 4: Prompt Templates — 11 files
All under `prompts/`:
1. `meta-prompt-generator.md`
2. `captain-clean-contexts.md` (was octoboss-clean-contexts)
3. `captain-reorganize-arms.md` (was octoboss-reorganize-tentacles)
4. `captain-reorganize-todos.md` (was octoboss-reorganize-todos)
5. `sandbox-init.md`
6. `fleet-parent.md` (was swarm-parent)
7. `fleet-worker.md` (was swarm-worker)
8. `arm-context-init.md` (was tentacle-context-init)
9. `arm-planner.md` (was tentacle-planner)
10. `arm-reorganize-todos.md` (was tentacle-reorganize-todos)
11. `arm-update-arm.md` (was tentacle-update-tentacle)

### Phase 5: Root Config + Packaging — ~10 files
1. `package.json` — root workspace
2. `pnpm-workspace.yaml`
3. `tsconfig.base.json`
4. `biome.json`
5. `.gitignore`
6. `README.md`
7. `CONTRIBUTING.md`
8. `CLAUDE.md`
9. `AGENTS.md`
10. `docs/` — 12 documentation files (renamed)

## Build Sequence

```
Phase 1 → Phase 5 → Phase 2 → Phase 4 → Phase 3
  core      config     api       prompts    web
```

Why this order:
- Core types must exist before API can import them
- Root config (pnpm workspace, tsconfig.base) must exist before packages resolve
- API must work before web can consume its endpoints
- Prompts are standalone files, can slot in anytime after API
- Web is last because it depends on everything

## Upgrade Opportunities (Post-MVP)

1. **Persistent channels** — JSONL-backed instead of in-memory Map
2. **SQLite for runtime state** — replace scattered JSON files
3. **Additional agent providers** — Gemini CLI, local agents
4. **MCP server** — expose Kraken as an MCP tool server
5. **API key auth** — for non-loopback access
6. **Plugin system** — extensible views and tools
