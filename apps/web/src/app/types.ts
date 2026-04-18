import type { GitHubCommitPoint, buildTerminalList } from "@kraken/core";

export type TerminalView = Awaited<ReturnType<typeof buildTerminalList>>;

export type {
  CodexUsageSnapshot,
  ClaudeUsageSnapshot,
  GitHubCommitPoint,
  GitHubRecentCommit,
  GitHubRepoSummarySnapshot,
  TerminalAgentProvider,
  ArmGitStatusSnapshot,
  ArmPullRequestSnapshot,
  MonitorUsageSnapshot,
  MonitorPost,
  MonitorConfigSnapshot,
  MonitorFeedSnapshot,
  ConversationTurn,
  ConversationTranscriptEvent,
  ConversationSessionSummary,
  ConversationSessionDetail,
  ConversationSearchHit,
} from "@kraken/core";

export type { PersistedUiState as FrontendUiStateSnapshot } from "@kraken/core";
export type { ArmWorkspaceMode as TerminalWorkspaceMode } from "@kraken/core";

export type GitHubCommitSparkPoint = GitHubCommitPoint & {
  x: number;
  y: number;
};

export type PromptLibraryEntry = {
  name: string;
  source: "builtin" | "user";
};

export type PromptDetail = {
  name: string;
  source: "builtin" | "user";
  content: string;
};
