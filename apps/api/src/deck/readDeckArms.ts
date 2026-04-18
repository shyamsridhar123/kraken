import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import type {
  CommandDeckAvailableSkill,
  ArmStatus as CommandDeckArmStatus,
  KrakenAppearance as CommandDeckOctopusAppearance,
  ArmSummary as CommandDeckArmSummary,
} from "@kraken/core";

import {
  applySuggestedSkillsToContext,
  parseSuggestedSkillsFromContext,
  readAvailableClaudeSkills,
} from "../claudeSkills";
import { markArmsInitialized } from "../setupState";

const ARMS_DIR = ".kraken/arms";
const DECK_STATE_PATH = ".kraken/state/deck.json";

const VALID_STATUSES: ReadonlySet<string> = new Set(["idle", "active", "blocked", "needs-review"]);

// ─── Deck state (app metadata, separate from agent-facing files) ────────────

type DeckArmState = {
  color: string | null;
  status: CommandDeckArmStatus;
  octopus: CommandDeckOctopusAppearance;
  scope: { paths: string[]; tags: string[] };
};

type DeckStateDocument = {
  arms: Record<string, DeckArmState>;
};

const readDeckState = (projectStateDir: string): DeckStateDocument => {
  const filePath = join(projectStateDir, "state", "deck.json");
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    if (
      raw &&
      typeof raw === "object" &&
      typeof raw.arms === "object" &&
      raw.arms !== null
    ) {
      return raw as DeckStateDocument;
    }
  } catch {
    // missing or corrupt — return empty
  }
  return { arms: {} };
};

const writeDeckState = (projectStateDir: string, state: DeckStateDocument): void => {
  const filePath = join(projectStateDir, "state", "deck.json");
  const dir = join(projectStateDir, "state");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`);
};

const parseArmState = (raw: unknown): DeckArmState => {
  const defaults: DeckArmState = {
    color: null,
    status: "idle",
    octopus: { animation: null, expression: null, accessory: null, hairColor: null },
    scope: { paths: [], tags: [] },
  };

  if (raw === null || typeof raw !== "object") return defaults;
  const rec = raw as Record<string, unknown>;

  const color =
    typeof rec.color === "string" && rec.color.trim().length > 0 ? rec.color.trim() : null;
  const status =
    typeof rec.status === "string" && VALID_STATUSES.has(rec.status)
      ? (rec.status as CommandDeckArmStatus)
      : "idle";

  const octopus: CommandDeckOctopusAppearance = {
    animation: null,
    expression: null,
    accessory: null,
    hairColor: null,
  };
  if (rec.octopus !== null && typeof rec.octopus === "object") {
    const o = rec.octopus as Record<string, unknown>;
    if (typeof o.animation === "string") octopus.animation = o.animation;
    if (typeof o.expression === "string") octopus.expression = o.expression;
    if (typeof o.accessory === "string") octopus.accessory = o.accessory;
    if (typeof o.hairColor === "string") octopus.hairColor = o.hairColor;
  }

  const scope = { paths: [] as string[], tags: [] as string[] };
  if (rec.scope !== null && typeof rec.scope === "object") {
    const s = rec.scope as Record<string, unknown>;
    if (Array.isArray(s.paths)) {
      scope.paths = s.paths.filter((p): p is string => typeof p === "string");
    }
    if (Array.isArray(s.tags)) {
      scope.tags = s.tags.filter((t): t is string => typeof t === "string");
    }
  }

  return { color, status, octopus, scope };
};

// ─── Parse CONTEXT.md for title and description ───────────────────────────────

const parseContextMd = (
  content: string,
): { displayName: string; description: string; suggestedSkills: string[] } | null => {
  const lines = content.split("\n");
  let displayName: string | null = null;
  let description = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!displayName) {
      const h1Match = trimmed.match(/^#\s+(.+)/);
      if (h1Match) {
        displayName = (h1Match[1] as string).trim();
      }
      continue;
    }
    // First non-empty line after the H1 is the description
    if (trimmed.length > 0) {
      description = trimmed;
      break;
    }
  }

  if (!displayName) return null;
  return { displayName, description, suggestedSkills: parseSuggestedSkillsFromContext(content) };
};

// ─── Todo parsing ───────────────────────────────────────────────────────────

export const parseTodoProgress = (
  content: string,
): { total: number; done: number; items: { text: string; done: boolean }[] } => {
  const lines = content.split("\n");
  let total = 0;
  let done = 0;
  const items: { text: string; done: boolean }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const checkedMatch = trimmed.match(/^- \[x\]\s+(.+)/i);
    const uncheckedMatch = trimmed.match(/^- \[ \]\s+(.+)/);

    if (checkedMatch) {
      total++;
      done++;
      items.push({ text: checkedMatch[1] as string, done: true });
    } else if (uncheckedMatch) {
      total++;
      items.push({ text: uncheckedMatch[1] as string, done: false });
    }
  }

  return { total, done, items };
};

// ─── Read all arms ──────────────────────────────────────────────────────────

export const readDeckArms = (
  workspaceCwd: string,
  projectStateDir?: string,
): CommandDeckArmSummary[] => {
  const armsRoot = join(workspaceCwd, ARMS_DIR);
  if (!existsSync(armsRoot)) return [];

  let entries: string[];
  try {
    entries = readdirSync(armsRoot);
  } catch {
    return [];
  }

  const deckState = readDeckState(projectStateDir ?? join(workspaceCwd, ".kraken"));
  const results: CommandDeckArmSummary[] = [];

  for (const entry of entries) {
    const entryPath = join(armsRoot, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    // An arm folder must have CONTEXT.md
    const contextMdPath = join(entryPath, "CONTEXT.md");
    if (!existsSync(contextMdPath)) continue;

    let agentInfo: { displayName: string; description: string };
    try {
      const content = readFileSync(contextMdPath, "utf-8");
      const parsed = parseContextMd(content);
      if (!parsed) continue;
      agentInfo = parsed;
    } catch {
      continue;
    }

    // App metadata from deck state
    const state = parseArmState(deckState.arms[entry]);

    // List markdown files in the arm folder (excluding CONTEXT.md itself)
    let vaultFiles: string[] = [];
    try {
      vaultFiles = readdirSync(entryPath)
        .filter((f) => f.endsWith(".md") && f !== "CONTEXT.md")
        .sort((a, b) => {
          if (a === "todo.md") return -1;
          if (b === "todo.md") return 1;
          return a.localeCompare(b);
        });
    } catch {
      // skip unreadable dirs
    }

    // Parse todo.md for progress
    let todoTotal = 0;
    let todoDone = 0;
    let todoItems: { text: string; done: boolean }[] = [];
    const todoPath = join(entryPath, "todo.md");
    if (existsSync(todoPath)) {
      try {
        const todoContent = readFileSync(todoPath, "utf-8");
        const progress = parseTodoProgress(todoContent);
        todoTotal = progress.total;
        todoDone = progress.done;
        todoItems = progress.items;
      } catch {
        // skip unreadable todo
      }
    }

    results.push({
      armId: entry,
      displayName: agentInfo.displayName,
      description: agentInfo.description,
      status: state.status,
      color: state.color,
      kraken: state.octopus,
      scope: state.scope,
      vaultFiles,
      todoTotal,
      todoDone,
      todoItems,
      suggestedSkills: [],
    });
  }

  return results;
};

// ─── Read a vault file from an arm ──────────────────────────────────────────

export const readDeckVaultFile = (
  workspaceCwd: string,
  armId: string,
  fileName: string,
): string | null => {
  // Prevent path traversal
  if (armId.includes("..") || armId.includes("/")) return null;
  if (fileName.includes("..") || fileName.includes("/")) return null;

  const filePath = join(workspaceCwd, ARMS_DIR, armId, fileName);

  if (!existsSync(filePath)) return null;

  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
};

/**
 * Toggle a todo checkbox in an arm's todo.md by item index.
 */
export const toggleTodoItem = (
  workspaceCwd: string,
  armId: string,
  itemIndex: number,
  done: boolean,
): { total: number; done: number; items: { text: string; done: boolean }[] } | null => {
  if (armId.includes("..") || armId.includes("/")) return null;

  const filePath = join(workspaceCwd, ARMS_DIR, armId, "todo.md");
  if (!existsSync(filePath)) return null;

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const lines = content.split("\n");
  let todoIndex = 0;
  let toggled = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] as string).trim();
    if (/^- \[[ xX]\]\s+/.test(trimmed)) {
      if (todoIndex === itemIndex) {
        lines[i] = done
          ? (lines[i] as string).replace(/- \[ \]/, "- [x]")
          : (lines[i] as string).replace(/- \[[xX]\]/, "- [ ]");
        toggled = true;
        break;
      }
      todoIndex++;
    }
  }

  if (!toggled) return null;

  const updated = lines.join("\n");
  try {
    writeFileSync(filePath, updated, "utf-8");
  } catch {
    return null;
  }

  return parseTodoProgress(updated);
};

/**
 * Edit the text of a todo item in an arm's todo.md by item index.
 */
export const editTodoItem = (
  workspaceCwd: string,
  armId: string,
  itemIndex: number,
  text: string,
): { total: number; done: number; items: { text: string; done: boolean }[] } | null => {
  if (armId.includes("..") || armId.includes("/")) return null;

  const filePath = join(workspaceCwd, ARMS_DIR, armId, "todo.md");
  if (!existsSync(filePath)) return null;

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const lines = content.split("\n");
  let todoIndex = 0;
  let edited = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] as string).trim();
    const match = trimmed.match(/^(- \[[ xX]\])\s+(.+)/);
    if (match) {
      if (todoIndex === itemIndex) {
        const indent = (lines[i] as string).match(/^(\s*)/)?.[1] ?? "";
        lines[i] = `${indent}${match[1]} ${text}`;
        edited = true;
        break;
      }
      todoIndex++;
    }
  }

  if (!edited) return null;

  const updated = lines.join("\n");
  try {
    writeFileSync(filePath, updated, "utf-8");
  } catch {
    return null;
  }

  return parseTodoProgress(updated);
};

/**
 * Add a new todo item to an arm's todo.md.
 */
export const addTodoItem = (
  workspaceCwd: string,
  armId: string,
  text: string,
): { total: number; done: number; items: { text: string; done: boolean }[] } | null => {
  if (armId.includes("..") || armId.includes("/")) return null;

  const filePath = join(workspaceCwd, ARMS_DIR, armId, "todo.md");
  if (!existsSync(filePath)) return null;

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const trimmed = content.endsWith("\n") ? content : `${content}\n`;
  const updated = `${trimmed}- [ ] ${text}\n`;

  try {
    writeFileSync(filePath, updated, "utf-8");
  } catch {
    return null;
  }

  return parseTodoProgress(updated);
};

/**
 * Delete a todo item from an arm's todo.md by item index.
 */
export const deleteTodoItem = (
  workspaceCwd: string,
  armId: string,
  itemIndex: number,
): { total: number; done: number; items: { text: string; done: boolean }[] } | null => {
  if (armId.includes("..") || armId.includes("/")) return null;

  const filePath = join(workspaceCwd, ARMS_DIR, armId, "todo.md");
  if (!existsSync(filePath)) return null;

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const lines = content.split("\n");
  let todoIndex = 0;
  let deleted = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] as string).trim();
    if (/^- \[[ xX]\]\s+/.test(trimmed)) {
      if (todoIndex === itemIndex) {
        lines.splice(i, 1);
        deleted = true;
        break;
      }
      todoIndex++;
    }
  }

  if (!deleted) return null;

  const updated = lines.join("\n");
  try {
    writeFileSync(filePath, updated, "utf-8");
  } catch {
    return null;
  }

  return parseTodoProgress(updated);
};

// ─── Create a new arm ───────────────────────────────────────────────────────

type CreateDeckArmInput = {
  name: string;
  description: string;
  color: string;
  octopus: CommandDeckOctopusAppearance;
  suggestedSkills?: string[];
};

type CreateDeckArmResult =
  | { ok: true; arm: CommandDeckArmSummary }
  | { ok: false; error: string };

export const createDeckArm = (
  workspaceCwd: string,
  input: CreateDeckArmInput,
  projectStateDir?: string,
): CreateDeckArmResult => {
  const stateDir = projectStateDir ?? join(workspaceCwd, ".kraken");
  const name = input.name.trim();
  if (name.length === 0) {
    return { ok: false, error: "Name is required" };
  }
  if (name.includes("..") || name.includes("/")) {
    return { ok: false, error: "Name contains invalid characters" };
  }

  const armDir = join(workspaceCwd, ARMS_DIR, name);
  if (existsSync(armDir)) {
    return { ok: false, error: "An arm with this name already exists" };
  }

  // Create the arm folder with agent-facing files
  mkdirSync(armDir, { recursive: true });

  const description = input.description.trim();
  const baseContextMd = description.length > 0 ? `# ${name}\n\n${description}\n` : `# ${name}\n`;
  const suggestedSkills = [...new Set((input.suggestedSkills ?? []).map((skill) => skill.trim()))]
    .filter((skill) => skill.length > 0)
    .sort((a, b) => a.localeCompare(b));
  const contextMd = applySuggestedSkillsToContext(baseContextMd, suggestedSkills);
  writeFileSync(join(armDir, "CONTEXT.md"), contextMd);
  writeFileSync(join(armDir, "todo.md"), "# Todo\n");

  // Persist app metadata in deck state
  const deckState = readDeckState(stateDir);
  deckState.arms[name] = {
    color: input.color,
    status: "idle",
    octopus: input.octopus,
    scope: { paths: [], tags: [] },
  };
  writeDeckState(stateDir, deckState);
  markArmsInitialized(stateDir);

  return {
    ok: true,
    arm: {
      armId: name,
      displayName: name,
      description,
      status: "idle",
      color: input.color,
      kraken: input.octopus,
      scope: { paths: [], tags: [] },
      vaultFiles: [],
      todoTotal: 0,
      todoDone: 0,
      todoItems: [],
      suggestedSkills: [],
    },
  };
};

export const listDeckAvailableSkills = (workspaceCwd: string): CommandDeckAvailableSkill[] =>
  readAvailableClaudeSkills(workspaceCwd);

export const updateDeckArmSuggestedSkills = (
  workspaceCwd: string,
  armId: string,
  suggestedSkills: string[],
  projectStateDir?: string,
): CommandDeckArmSummary | null => {
  if (armId.includes("..") || armId.includes("/")) return null;

  const contextPath = join(workspaceCwd, ARMS_DIR, armId, "CONTEXT.md");
  if (!existsSync(contextPath)) return null;

  try {
    const existing = readFileSync(contextPath, "utf8");
    const updated = applySuggestedSkillsToContext(existing, suggestedSkills);
    writeFileSync(contextPath, updated, "utf8");
  } catch {
    return null;
  }

  return (
    readDeckArms(workspaceCwd, projectStateDir).find(
      (arm) => arm.armId === armId,
    ) ?? null
  );
};

// ─── Delete an arm ──────────────────────────────────────────────────────────

export const deleteDeckArm = (
  workspaceCwd: string,
  armId: string,
  projectStateDir?: string,
): { ok: true } | { ok: false; error: string } => {
  const stateDir = projectStateDir ?? join(workspaceCwd, ".kraken");
  if (armId.includes("..") || armId.includes("/")) {
    return { ok: false, error: "Invalid arm ID" };
  }

  const armDir = join(workspaceCwd, ARMS_DIR, armId);
  if (!existsSync(armDir)) {
    return { ok: false, error: "Arm not found" };
  }

  rmSync(armDir, { recursive: true, force: true });

  // Remove from deck state
  const deckState = readDeckState(stateDir);
  delete deckState.arms[armId];
  writeDeckState(stateDir, deckState);

  return { ok: true };
};
