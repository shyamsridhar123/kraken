// Re-export all terminalRuntime types and functions
export type {
  TerminalStateMessage,
  TerminalOutputMessage,
  TerminalHistoryMessage,
  TerminalRenameMessage,
  TerminalActivityMessage,
  TerminalServerMessage,
  DirectSessionListener,
  TerminalSession,
  TerminalNameOrigin,
  PersistedTerminal,
  GitClientPullRequestSnapshot,
  TerminalRegistryDocument,
  GitClient,
  CreateTerminalRuntimeOptions,
} from "./types";

export {
  RuntimeInputError,
  type ChannelMessage,
  type PersistedUiState,
  type ArmGitStatusSnapshot,
  type ArmPullRequestSnapshot,
  type ArmWorkspaceMode,
  type TerminalAgentProvider,
  isTerminalAgentProvider,
  isTerminalCompletionSoundId,
} from "./types";

export {
  TERMINAL_ID_PREFIX,
  TERMINAL_REGISTRY_VERSION,
  TERMINAL_REGISTRY_RELATIVE_PATH,
  TERMINAL_TRANSCRIPT_RELATIVE_PATH,
  ARM_WORKTREE_RELATIVE_PATH,
  ARM_WORKTREE_BRANCH_PREFIX,
  DEFAULT_AGENT_PROVIDER,
  MAX_CHILDREN_PER_PARENT,
  TERMINAL_BOOTSTRAP_COMMANDS,
  TERMINAL_SESSION_IDLE_GRACE_MS,
  TERMINAL_SCROLLBACK_MAX_BYTES,
  DEFAULT_TERMINAL_INACTIVITY_THRESHOLD_MS,
} from "./constants";

export { parseClaudeTranscript } from "./claudeTranscript";

export {
  transcriptFilenameForSession,
  readConversationSession,
  listConversationSessions,
  ensureTranscriptDirectory,
  deleteConversation,
  deleteAllConversations,
  storeClaudeTranscriptTurns,
  searchConversations,
  type ConversationTranscriptEventBase,
  type SessionStartTranscriptEvent,
  type InputSubmitTranscriptEvent,
  type OutputChunkTranscriptEvent,
  type StateChangeTranscriptEvent,
  type SessionEndTranscriptEvent,
  type ConversationTranscriptEvent,
  type ConversationTranscriptEventPayload,
  type ConversationTurn,
} from "./conversations";

export { createGitOperations } from "./gitOperations";
export { createHookProcessor } from "./hookProcessor";

export {
  loadTerminalRegistry,
  persistTerminalRegistry,
  createTerminalRegistryPersistence,
} from "./registry";

export { createSessionRuntime } from "./sessionRuntime";

export { createWorktreeManager } from "./worktreeManager";
