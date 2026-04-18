/**
 * Claude usage tracking stubs.
 * These functions are imported but the actual implementation is not provided.
 */

export type ClaudeUsageSnapshot = {
  status: "ok" | "unavailable" | "error";
  source?: string;
  message?: string;
  fetchedAt?: string;
  planType?: string;
  primaryUsedPercent?: number | null;
  primaryResetAt?: string | null;
  secondaryUsedPercent?: number | null;
  secondaryResetAt?: string | null;
  sonnetUsedPercent?: number | null;
  sonnetResetAt?: string | null;
  extraUsageCostUsed?: number;
  extraUsageCostLimit?: number;
};

type UsageOptions = {
  projectStateDir?: string;
  backgroundRefreshOnly?: boolean;
  now?: () => Date;
  spawnCliUsage?: (cmd: string) => Promise<string | null>;
  readCredentialsJson?: () => Promise<Record<string, unknown>>;
  fetchImpl?: typeof fetch;
};

export const stripAnsiCodes = (str: string): string => {
  return str.replace(/\u001B\[[0-9;]*m/g, "");
};

export type CliUsageOutput = {
  primaryUsedPercent: number | null;
  secondaryUsedPercent: number | null;
  sonnetUsedPercent?: number | null;
};

export const parseCliUsageOutput = (output: string): CliUsageOutput => {
  const stripped = stripAnsiCodes(output);

  const result: CliUsageOutput = {
    primaryUsedPercent: null,
    secondaryUsedPercent: null,
    sonnetUsedPercent: null,
  };

  // Match patterns: "Current session\n  2% used" or "Current session: 35% used"
  const primaryMatch = stripped.match(/Current session[:\s]*\n?\s*(\d+(?:\.\d+)?)\s*%\s*(used|remaining)/i) ||
                       stripped.match(/Current session:\s*(\d+(?:\.\d+)?)\s*%\s*(used|remaining)/i);
  if (primaryMatch) {
    const percent = parseFloat(primaryMatch[1]!);
    const value = primaryMatch[2]?.toLowerCase() === "remaining" ? 100 - percent : percent;
    result.primaryUsedPercent = Math.round(value * 10) / 10; // Round to 1 decimal place
  }

  // Match "Current week (all models)" or similar
  const secondaryMatch = stripped.match(/Current week\s*\([^)]*all models[^)]*\)[:\s]*\n?\s*(\d+(?:\.\d+)?)\s*%\s*(used|remaining)/i) ||
                         stripped.match(/Current week\s*\([^)]*all models[^)]*\):\s*(\d+(?:\.\d+)?)\s*%\s*(used|remaining)/i);
  if (secondaryMatch) {
    const percent = parseFloat(secondaryMatch[1]!);
    const value = secondaryMatch[2]?.toLowerCase() === "remaining" ? 100 - percent : percent;
    result.secondaryUsedPercent = Math.round(value * 10) / 10;
  }

  // Match "Current week (Sonnet only)" or "Current week (Opus)" or "Current week (Sonnet)" or "Current week (Opus)"
  const sonnetMatch = stripped.match(/Current week\s*\([^)]*(?:Sonnet|Opus)[^)]*\)[:\s]*\n?\s*(\d+(?:\.\d+)?)\s*%\s*(used|remaining)/i) ||
                      stripped.match(/Current week\s*\([^)]*(?:Sonnet|Opus)[^)]*\):\s*(\d+(?:\.\d+)?)\s*%\s*(used|remaining)/i);
  if (sonnetMatch) {
    const percent = parseFloat(sonnetMatch[1]!);
    const value = sonnetMatch[2]?.toLowerCase() === "remaining" ? 100 - percent : percent;
    result.sonnetUsedPercent = Math.round(value * 10) / 10;
  }

  return result;
};

let cliSessionCache: string | null = null;

export const resetCliSession = (): void => {
  cliSessionCache = null;
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
