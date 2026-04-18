# Kraken E2E Test Report

**Date:** 2026-04-18
**Tester:** Claude Code (automated)
**Tools:** agent-browser (Vercel), curl, Node.js tsx
**Environment:** Windows 11, Node.js 22, localhost

---

## Test Environment Setup

### Servers Started
- **API Server:** `npx tsx apps/api/src/server.ts` → `http://127.0.0.1:8787`
- **Web Server:** `npx vite` (apps/web) → `http://localhost:5173`
- **State:** Clean (`.kraken/` removed before each run)

---

## Test Suite 1: API Endpoint Verification

### Use Case
Verify all REST API endpoints return correct responses for a fresh Kraken installation with no existing arms, terminals, or conversations.

### Steps & Results

| # | Step | Command | Expected | Actual | Status |
|---|------|---------|----------|--------|--------|
| 1 | Health check | `GET /api/health` | `{"status":"ok"}` | `{"status":"ok","timestamp":"..."}` | **PASS** |
| 2 | Setup status | `GET /api/setup` | First-run state with 6 steps | `isFirstRun=true, armCount=0, 6 steps` | **PASS** |
| 3 | Terminal list | `GET /api/terminal-snapshots` | Empty array | `[]` | **PASS** |
| 4 | Arms list (empty) | `GET /api/command-deck/arms` | Empty array | `[]` | **PASS** |
| 5 | Prompt templates | `GET /api/prompts` | 11 built-in prompts | 11 prompts (arm-*, captain-*, fleet-*, meta-prompt-generator, sandbox-init) | **PASS** |
| 6 | Claude usage | `GET /api/claude/usage` | Graceful unavailable | `{"status":"unavailable","message":"..."}` | **PASS** |
| 7 | UI state | `GET /api/ui-state` | Empty object | `{}` | **PASS** |
| 8 | Conversations | `GET /api/conversations` | Empty array | `[]` | **PASS** |

**Result: 8/8 PASS**

---

## Test Suite 2: Arm CRUD Flow (Core Use Case)

### Use Case
A developer wants to create a scoped context ("arm") for a slice of their codebase. The arm should persist as files on disk with a CONTEXT.md and todo.md.

### Steps & Results

| # | Step | Command | Expected | Actual | Status |
|---|------|---------|----------|--------|--------|
| 1 | Create arm | `POST /api/command-deck/arms` with `{"name":"e2e-test-arm","description":"End-to-end test arm"}` | Arm created with full metadata | `{"armId":"e2e-test-arm","displayName":"e2e-test-arm","description":"End-to-end test arm for documentation","status":"idle","color":"#d4a017","kraken":{...},"scope":{"paths":[],"tags":[]},"vaultFiles":[],"todoTotal":0,"todoDone":0,"todoItems":[],"suggestedSkills":[]}` | **PASS** |
| 2 | List arms | `GET /api/command-deck/arms` | Array containing the created arm | `[{"armId":"e2e-test-arm",...}]` | **PASS** |
| 3 | Verify CONTEXT.md | `cat .kraken/arms/e2e-test-arm/CONTEXT.md` | Contains arm name and description | `# e2e-test-arm\n\nEnd-to-end test arm for documentation` | **PASS** |
| 4 | Verify todo.md | `cat .kraken/arms/e2e-test-arm/todo.md` | Empty todo template | `# Todo` | **PASS** |

**Result: 4/4 PASS**

---

## Test Suite 3: Web Dashboard Visual Verification

### Use Case
A developer opens the Kraken dashboard in their browser and sees the management interface.

### Steps & Results

| # | Step | Tool | Expected | Actual | Status |
|---|------|------|----------|--------|--------|
| 1 | Open dashboard | agent-browser `open http://localhost:5173` | Page loads | Page title: "Kraken" | **PASS** |
| 2 | Screenshot initial state | agent-browser `screenshot` | Dashboard renders | See `screenshots/01-dashboard-initial.png` | **PASS** |
| 3 | Verify header branding | Visual inspection | "KRAKEN" text visible | Yellow kraken icon + "KRAKEN" text in top-left | **PASS** |
| 4 | Verify navigation tabs | Accessibility snapshot | 8 navigation buttons | `[1] Agents, [2] CommandDeck, [3] Activity, [4] Code Intel, [5] Monitor, [6] Conversations, [7] Prompts, [8] Settings` | **PASS** |
| 5 | Verify workspace setup card | Accessibility snapshot | Setup wizard visible | Workspace Setup heading with 6 action buttons (Initialize, .gitignore, Claude, Git, curl, Launch) | **PASS** |
| 6 | Verify canvas controls | Accessibility snapshot | Graph view controls | Terminal, Worktree, Arm, Fit, Refresh, Hide Idle, Delete All buttons | **PASS** |
| 7 | Verify commits chart | Visual inspection | Chart area rendered | "COMMITS/DAY · LAST 30 DAYS" with bar chart | **PASS** |
| 8 | Verify usage section | Visual inspection | Claude usage displayed | "CLAUDE USAGE" with Session=NA, Week (all)=NA | **PASS** |

**Result: 8/8 PASS**

### Accessibility Snapshot (Full UI Structure)
```
- region "Runtime status strip"
  - StaticText "KRAKEN"
  - "COMMITS/DAY · LAST 30 DAYS" (chart)
  - "CLAUDE TOKENS/DAY · LAST 30 DAYS" (chart)
  - "CLAUDE USAGE" (Session/Week metrics)
- navigation "Primary navigation"
  - button "[1] Agents"
  - button "[2] CommandDeck"
  - button "[3] Activity"
  - button "[4] Code Intel"
  - button "[5] Monitor"
  - button "[6] Conversations"
  - button "[7] Prompts"
  - button "[8] Settings"
- region "Main content canvas"
  - region "Canvas graph view" (Terminal/Worktree/Arm controls)
  - region "Workspace setup" (6 setup step buttons)
- region "Telemetry ticker tape"
```

---

## Test Suite 4: End-to-End Workflow (API + Disk + UI)

### Use Case
Complete developer workflow: start Kraken → create an arm for API work → verify context files are generated → confirm the arm appears in the dashboard API.

### Steps

1. **Start API server** on port 8787 — `npx tsx apps/api/src/server.ts`
2. **Start web server** on port 5173 — `npx vite`
3. **Verify health** — `curl http://127.0.0.1:8787/api/health` → `{"status":"ok"}`
4. **Open dashboard** — agent-browser → Kraken logo, 8 nav tabs, workspace setup visible
5. **Create arm via API** — `POST /api/command-deck/arms` with `{"name":"api-backend","description":"API runtime and request handling"}`
6. **Verify arm returned** — Response contains `armId`, `displayName`, `description`, `status`, `color`, `kraken` appearance, `scope`, `todoItems`
7. **Verify arm listed** — `GET /api/command-deck/arms` returns array with the created arm
8. **Verify disk files** — `.kraken/arms/api-backend/CONTEXT.md` exists with heading + description
9. **Verify todo.md** — `.kraken/arms/api-backend/todo.md` exists with `# Todo` template
10. **Check all 11 prompts loaded** — `GET /api/prompts` returns 11 templates (arm-context-init, arm-planner, arm-reorganize-todos, arm-update-arm, captain-clean-contexts, captain-reorganize-arms, captain-reorganize-todos, fleet-parent, fleet-worker, meta-prompt-generator, sandbox-init)

### Result: **ALL STEPS PASS**

---

## Screenshots

| File | Description |
|------|-------------|
| `screenshots/01-dashboard-initial.png` | Initial dashboard with Kraken branding, nav tabs, workspace setup, commits chart |

---

## Known Limitations (Not Tested)

| Feature | Why Not Tested | Risk |
|---------|---------------|------|
| PTY terminal spawn | Requires `claude` CLI installed and running | High — core feature |
| WebSocket streaming | Requires active PTY session | High — core feature |
| Fleet orchestration | Requires multiple terminals | Medium |
| Channel messaging | Requires multiple terminals | Medium |
| Git worktree creation | Requires git repo context | Medium |
| Navigation between views | agent-browser refs go stale between commands | Low — UI routing |
| Conversation transcript persistence | No active sessions to record | Low |

---

## Summary

| Suite | Passed | Failed | Total |
|-------|--------|--------|-------|
| API Endpoints | 8 | 0 | 8 |
| Arm CRUD Flow | 4 | 0 | 4 |
| Dashboard Visual | 8 | 0 | 8 |
| E2E Workflow | 10 | 0 | 10 |
| **TOTAL** | **30** | **0** | **30** |

**Overall: 30/30 PASS**

All tested functionality works correctly. The primary untested area is PTY terminal management (spawning real Claude Code sessions), which requires the `claude` CLI to be available and is the next priority for testing.
