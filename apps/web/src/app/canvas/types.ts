import type {
  AgentRuntimeState,
  AgentState,
  CommandDeckOctopusAppearance,
  ArmWorkspaceMode,
} from "@kraken/core";

export type GraphNode = {
  id: string;
  type: "arm" | "captain" | "active-session" | "inactive-session";
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
  radius: number;
  armId: string;
  label: string;
  color: string;
  sessionId?: string;
  agentState?: AgentState;
  agentRuntimeState?: AgentRuntimeState;
  waitingToolName?: string;
  hasUserPrompt?: boolean;
  workspaceMode?: ArmWorkspaceMode;
  parentTerminalId?: string;
  firstPromptPreview?: string;
  octopus?: CommandDeckOctopusAppearance;
};

export type GraphEdge = {
  source: string;
  target: string;
};
