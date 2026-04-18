/**
 * Claude usage tracking stubs.
 * These functions are imported but the actual implementation is not provided.
 */

export type ClaudeUsageSnapshot = {
  status: "ok" | "unavailable" | "error";
  source?: string;
  message?: string;
  fetchedAt?: string;
};

type UsageOptions = {
  projectStateDir?: string;
  backgroundRefreshOnly?: boolean;
};

export const readClaudeUsageSnapshot = async (options?: UsageOptions): Promise<ClaudeUsageSnapshot> => {
  return {
    status: "unavailable",
    message: "Claude usage tracking not implemented",
  };
};

export const readClaudeOauthUsageSnapshot = async (options?: UsageOptions): Promise<ClaudeUsageSnapshot> => {
  return {
    status: "unavailable",
    message: "Claude OAuth usage tracking not implemented",
  };
};

export const readClaudeCliUsageSnapshot = async (options?: UsageOptions): Promise<ClaudeUsageSnapshot> => {
  return {
    status: "unavailable",
    message: "Claude CLI usage tracking not implemented",
  };
};

export const invalidateUsageCache = async (): Promise<void> => {
  // No-op
};
