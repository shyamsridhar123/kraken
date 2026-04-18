# Arms

Arms are the core abstraction in Kraken.

## Definition

A arm is a folder under `.kraken/arms/<arm-id>/` that stores agent-readable markdown files.

The minimum useful files are:

- `CONTEXT.md`
- `todo.md`

Additional markdown files are allowed and are surfaced as arm vault files in the app.

## What a arm is for

Use a arm when you want a durable context layer for one slice of the codebase or one track of work.

Examples:

- API runtime
- frontend shell
- prompt system
- monitor integration
- release work

## What goes in `CONTEXT.md`

`CONTEXT.md` should explain:

- what this area owns
- the important files or directories
- what already exists
- constraints and edge cases
- what not to break
- any Claude Code skills that are especially useful for this arm, when relevant

The first heading and first non-empty paragraph are used by the runtime as the display name and description.

When a arm has suggested Claude Code skills, Kraken appends a managed block at the bottom of `CONTEXT.md`:

```md
<!-- kraken:suggested-skills:start -->
## Suggested Skills

You can use these skills if you need to.

- `skill-name`
<!-- kraken:suggested-skills:end -->
```

## What goes in `todo.md`

`todo.md` should contain markdown checkbox items:

```md
# Todo

- [ ] add request validation for monitor config
- [ ] cover the invalid payload case in tests
- [x] wire the route into the request handler
```

The runtime parses checkbox lines and computes progress.

## Arms and delegation

The point of a arm is not only documentation. It is operational context.

A worker attached to a arm can:

- read local notes first
- stay scoped to that area
- use the todo list as a work queue
- hand work to child agents without rebuilding context from scratch

## Arms and worktrees

Arms are not the same thing as worktrees.

- a arm is a context folder
- a worktree is an isolated git checkout for a terminal

You can use a arm with shared workspace terminals or worktree terminals.
