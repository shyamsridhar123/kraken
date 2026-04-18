import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";

import type { UsageChartResponse } from "../claudeSessionScanner";
import type { ClaudeUsageSnapshot } from "../claudeUsage";
import type { CodeIntelStore } from "../codeIntelStore";
import type { CodexUsageSnapshot } from "../codexUsage";
import type { GitHubRepoSummarySnapshot } from "../githubRepoSummary";
import type { MonitorService } from "../monitor";
import type {
  ArmGitStatusSnapshot,
  ArmPullRequestSnapshot,
  ArmWorkspaceMode,
  ChannelMessage,
  PersistedTerminal,
  PersistedUiState,
  TerminalAgentProvider,
  TerminalNameOrigin,
} from "../terminalRuntime";
import { RequestBodyTooLargeError, readJsonBody } from "./requestParsers";
import { withCors } from "./security";

export type CreateTerminalInput = {
  terminalId?: string;
  armId?: string;
  worktreeId?: string;
  armName?: string;
  workspaceMode: ArmWorkspaceMode;
  agentProvider?: TerminalAgentProvider;
  nameOrigin?: TerminalNameOrigin;
  initialPrompt?: string;
  initialInputDraft?: string;
  autoRenamePromptContext?: string;
  parentTerminalId?: string;
  baseRef?: string;
};

export type TerminalRuntime = {
  listTerminalSnapshots(): PersistedTerminal[];
  createTerminal(input: CreateTerminalInput): PersistedTerminal;
  deleteTerminal(terminalId: string): void;
  renameTerminal(terminalId: string, name: string): PersistedTerminal | null;
  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): boolean;
  handleHook(hookName: string, payload: unknown, krakenSessionId?: string): { ok: boolean };
  readUiState(): PersistedUiState;
  patchUiState(patch: Record<string, unknown>): PersistedUiState;
  listConversationSessions(): unknown[];
  deleteAllConversationSessions(): void;
  deleteConversationSession(sessionId: string): void;
  readConversationSession(sessionId: string): unknown | null;
  searchConversations(query: string): unknown[];
  exportConversationSession(sessionId: string, format: string): string | null;
  readArmGitStatus(armId: string): ArmGitStatusSnapshot | null;
  commitArmWorktree(armId: string, message: string): ArmGitStatusSnapshot | null;
  pushArmWorktree(armId: string): ArmGitStatusSnapshot | null;
  syncArmWorktree(armId: string, baseRef?: string): ArmGitStatusSnapshot | null;
  mergeArmPullRequest(armId: string): ArmPullRequestSnapshot | null;
  readArmPullRequest(armId: string): ArmPullRequestSnapshot | null;
  createArmPullRequest(
    armId: string,
    input: { title: string; body?: string; baseRef?: string },
  ): ArmPullRequestSnapshot | null;
  listChannelMessages(terminalId: string): ChannelMessage[];
  sendChannelMessage(
    terminalId: string,
    fromTerminalId: string,
    content: string,
  ): ChannelMessage | null;
  close(): Promise<void>;
};

export type RouteHandlerDependencies = {
  runtime: TerminalRuntime;
  workspaceCwd: string;
  projectStateDir: string;
  promptsDir: string;
  userPromptsDir: string;
  getApiBaseUrl: () => string;
  getApiPort: () => string;
  readClaudeUsageSnapshot: () => Promise<ClaudeUsageSnapshot>;
  readClaudeOauthUsageSnapshot: () => Promise<ClaudeUsageSnapshot>;
  readClaudeCliUsageSnapshot: () => Promise<ClaudeUsageSnapshot>;
  readCodexUsageSnapshot: () => Promise<CodexUsageSnapshot>;
  readGithubRepoSummary: () => Promise<GitHubRepoSummarySnapshot>;
  scanUsageHeatmap: (scope: "all" | "project") => Promise<UsageChartResponse>;
  monitorService: MonitorService;
  invalidateClaudeUsageCache: () => void;
  codeIntelStore: CodeIntelStore;
};

export type RouteHandlerContext = {
  request: IncomingMessage;
  response: ServerResponse;
  requestUrl: URL;
  corsOrigin: string | null;
};

type JsonBodyReadResult = { ok: true; payload: unknown } | { ok: false };
export type ApiRouteHandler = (
  context: RouteHandlerContext,
  dependencies: RouteHandlerDependencies,
) => Promise<boolean>;

export const writeJson = (
  response: ServerResponse,
  status: number,
  payload: unknown,
  corsOrigin: string | null,
) => {
  response.writeHead(status, withCors({ "Content-Type": "application/json" }, corsOrigin));
  response.end(JSON.stringify(payload));
};

export const writeText = (
  response: ServerResponse,
  status: number,
  payload: string,
  contentType: string,
  corsOrigin: string | null,
) => {
  response.writeHead(status, withCors({ "Content-Type": contentType }, corsOrigin));
  response.end(payload);
};

export const writeNoContent = (
  response: ServerResponse,
  status: number,
  corsOrigin: string | null,
) => {
  response.writeHead(status, withCors({}, corsOrigin));
  response.end();
};

export const writeMethodNotAllowed = (response: ServerResponse, corsOrigin: string | null) => {
  writeJson(response, 405, { error: "Method not allowed" }, corsOrigin);
};

export const readJsonBodyOrWriteError = async (
  request: IncomingMessage,
  response: ServerResponse,
  corsOrigin: string | null,
): Promise<JsonBodyReadResult> => {
  try {
    const payload = await readJsonBody(request);
    return { ok: true, payload };
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      writeJson(response, 413, { error: "Request body too large." }, corsOrigin);
      return { ok: false };
    }

    writeJson(response, 400, { error: "Invalid JSON body." }, corsOrigin);
    return { ok: false };
  }
};
