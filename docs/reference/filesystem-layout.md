# Filesystem Layout

## Project-local files

`.kraken/` is created in the workspace.

Main paths:

- `.kraken/project.json`
- `.kraken/arms/`
- `.kraken/worktrees/`

Arm example:

```text
.kraken/
  arms/
    api-backend/
      CONTEXT.md
      todo.md
      routes.md
```

`CONTEXT.md` may end with a managed `Suggested Skills` block when the operator or planner attaches Claude Code skills to that arm.

Project-local Claude Code skills, when present, live under:

```text
.claude/
  skills/
    some-skill/
      SKILL.md
```

## Global state

Per-project runtime state is stored under:

```text
~/.kraken/projects/<project-id>/state/
```

Notable files:

- `arms.json`
- `command-deck.json`
- `transcripts/<sessionId>.jsonl`
- `monitor-config.json`
- `monitor-cache.json`
- `code-intel.jsonl`

## Prompt storage

- core prompts are synced from `prompts/`
- synced copies live in `.kraken/prompts/core/`
- user prompts live in `.kraken/prompts/`

## Practical rule

If something is agent-facing context, keep it in the arm folder.

If something is runtime-owned state, expect it under the global project state directory.
