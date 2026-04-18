import type { AgentRuntimeState } from "./agentRuntime.js";

export type AgentState = "live" | "idle" | "queued" | "blocked";
export type ArmWorkspaceMode = "shared" | "worktree";

export type TerminalSnapshot = {
  terminalId: string;
  label: string;
  state: AgentState;
  armId: string;
  armName?: string;
  workspaceMode?: ArmWorkspaceMode;
  createdAt: string;
  hasUserPrompt?: boolean;
  parentTerminalId?: string;
  agentRuntimeState?: AgentRuntimeState;
};
