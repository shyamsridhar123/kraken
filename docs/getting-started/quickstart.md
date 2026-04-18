# Quickstart

This is the shortest useful path through the project.

## 1. Start the app

For local development:

```bash
pnpm install
pnpm dev
```

For a local global CLI install from a clone:

```bash
pnpm install
pnpm build
npm install -g .
kraken
```

Kraken is not published to npm yet, so `npm install -g kraken` is not currently a valid quick start path.

On a fresh workspace, Kraken opens the Command-Deck setup flow first. The setup card verifies the
workspace files, `.gitignore`, and local prerequisites before you create arms.

## 2. Create or inspect a arm

If the app is already running, you can create a arm from the CLI:

```bash
kraken arm create api-backend --description "API runtime and request handling"
```

Or use the Command-Deck view in the UI.

Each arm becomes a folder under `.kraken/arms/<arm-id>/`.

## 3. Let the agent build the local context

The arm files are where the job keeps its local context:

- `CONTEXT.md` for the local model of that area
- `todo.md` for concrete tasks
- extra markdown files for notes, architecture, handoff, or examples

You do not need to treat these as manual setup that the developer always writes by hand. One of the points of Kraken is that **Claude Code** can help create, update, and maintain these files from inside the app as the work becomes clearer.

## 4. Create a terminal

```bash
kraken terminal create --name "API worker" --arm-id api-backend
```

Use `--workspace-mode worktree` if you want an isolated git worktree.

## 5. Delegate from todo items

The runtime can parse incomplete items in `todo.md` and use them as inputs when spawning child agents from the Command-Deck fleet flow. That means one item can become one worker, or a larger list can become a fleet.

## 6. Send a message

```bash
kraken channel send terminal-2 "Need review on the request parser changes"
```

## What to verify

- the arm folder exists
- the terminal appears in the UI
- `CONTEXT.md` and `todo.md` exist for that arm
- todo progress is visible
- messages show up in the target terminal channel

## Next reading

- [Mental Model](../concepts/mental-model.md)
- [Arms](../concepts/arms.md)
