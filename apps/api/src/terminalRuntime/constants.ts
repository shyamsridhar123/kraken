export const TERMINAL_ID_PREFIX = "terminal-";
export const TERMINAL_REGISTRY_VERSION = 3;
export const TERMINAL_REGISTRY_RELATIVE_PATH = ".kraken/state/arms.json";
export const TERMINAL_TRANSCRIPT_RELATIVE_PATH = ".kraken/state/transcripts";
export const ARM_WORKTREE_RELATIVE_PATH = ".kraken/worktrees";
export const ARM_WORKTREE_BRANCH_PREFIX = "kraken/";
export const DEFAULT_AGENT_PROVIDER = "claude-code" as const;
export const MAX_CHILDREN_PER_PARENT = 100;

export const TERMINAL_BOOTSTRAP_COMMANDS: Record<string, string> = {
  codex: "codex",
  "claude-code": "claude",
  "gemini-cli": "gemini",
};
export const TERMINAL_SESSION_IDLE_GRACE_MS = 5 * 60 * 1000;
export const TERMINAL_SCROLLBACK_MAX_BYTES = 512 * 1024;
export const DEFAULT_TERMINAL_INACTIVITY_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
