type LocationLike = Pick<Location, "host" | "protocol">;

const readRuntimeBaseUrl = (): string | null => {
  const value = import.meta.env.VITE_KRAKEN_API_ORIGIN;
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const withTrailingSlash = (value: string) => (value.endsWith("/") ? value : `${value}/`);

const buildAbsoluteUrl = (baseUrl: string, pathname: string) => {
  const normalizedPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  return new URL(normalizedPath, withTrailingSlash(baseUrl)).toString();
};

const localWebSocketUrl = (location: LocationLike, armId: string) => {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/api/terminals/${armId}/ws`;
};

const localRuntimeWebSocketUrl = (location: LocationLike, pathname: string) => {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}${pathname}`;
};

const toWebSocketBase = (runtimeBaseUrl: string): string | null => {
  try {
    const url = new URL(runtimeBaseUrl);
    if (url.protocol === "https:") {
      url.protocol = "wss:";
      return url.toString();
    }
    if (url.protocol === "http:") {
      url.protocol = "ws:";
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
};

export const buildTerminalSnapshotsUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/terminal-snapshots";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/terminal-snapshots");
};

export const buildTerminalEventsSocketUrl = (
  runtimeBaseUrl = readRuntimeBaseUrl(),
  location: LocationLike = window.location,
) => {
  if (!runtimeBaseUrl) {
    return localRuntimeWebSocketUrl(location, "/api/terminal-events/ws");
  }

  const websocketBase = toWebSocketBase(runtimeBaseUrl);
  if (!websocketBase) {
    return localRuntimeWebSocketUrl(location, "/api/terminal-events/ws");
  }

  return buildAbsoluteUrl(websocketBase, "/api/terminal-events/ws");
};

export const buildTerminalsUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/terminals";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/terminals");
};

export const buildCodexUsageUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/codex/usage";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/codex/usage");
};

export const buildClaudeUsageUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/claude/usage";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/claude/usage");
};

export const buildGithubSummaryUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/github/summary";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/github/summary");
};

export const buildUiStateUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/ui-state";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/ui-state");
};

export const buildWorkspaceSetupUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/setup";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/setup");
};

export const buildWorkspaceSetupStepUrl = (
  stepId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const path = `/api/setup/steps/${encodeURIComponent(stepId)}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildMonitorConfigUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/monitor/config";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/monitor/config");
};

export const buildMonitorFeedUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/monitor/feed";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/monitor/feed");
};

export const buildMonitorRefreshUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/monitor/refresh";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/monitor/refresh");
};

export const buildUsageHeatmapUrl = (
  scope: "all" | "project" = "all",
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const path = `/api/analytics/usage-heatmap?scope=${scope}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildConversationsUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/conversations";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/conversations");
};

export const buildConversationSearchUrl = (
  query: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const path = `/api/conversations/search?q=${encodeURIComponent(query)}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildConversationSessionUrl = (
  sessionId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const encodedSessionId = encodeURIComponent(sessionId);
  const path = `/api/conversations/${encodedSessionId}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildConversationExportUrl = (
  sessionId: string,
  format: "json" | "md",
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const encodedSessionId = encodeURIComponent(sessionId);
  const path = `/api/conversations/${encodedSessionId}/export?format=${format}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildArmRenameUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const encodedArmId = encodeURIComponent(armId);
  if (!runtimeBaseUrl) {
    return `/api/arms/${encodedArmId}`;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, `/api/arms/${encodedArmId}`);
};

const buildArmGitActionUrl = (
  armId: string,
  action: "status" | "commit" | "push" | "sync",
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const encodedArmId = encodeURIComponent(armId);
  const path = `/api/arms/${encodedArmId}/git/${action}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildArmGitStatusUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => buildArmGitActionUrl(armId, "status", runtimeBaseUrl);

export const buildArmGitCommitUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => buildArmGitActionUrl(armId, "commit", runtimeBaseUrl);

export const buildArmGitPushUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => buildArmGitActionUrl(armId, "push", runtimeBaseUrl);

export const buildArmGitSyncUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => buildArmGitActionUrl(armId, "sync", runtimeBaseUrl);

export const buildArmGitPullRequestUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const encodedArmId = encodeURIComponent(armId);
  const path = `/api/arms/${encodedArmId}/git/pr`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildArmGitPullRequestMergeUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const encodedArmId = encodeURIComponent(armId);
  const path = `/api/arms/${encodedArmId}/git/pr/merge`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildDeckArmsUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/command-commandDeck/arms";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/command-commandDeck/arms");
};

export const buildDeckSkillsUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/command-commandDeck/skills";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/command-commandDeck/skills");
};

export const buildDeckArmUrl = (armId: string, runtimeBaseUrl = readRuntimeBaseUrl()) => {
  const encodedArmId = encodeURIComponent(armId);
  const path = `/api/command-commandDeck/arms/${encodedArmId}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildDeckArmSkillsUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const path = `/api/command-commandDeck/arms/${encodeURIComponent(armId)}/skills`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildDeckVaultFileUrl = (
  armId: string,
  fileName: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const encodedArmId = encodeURIComponent(armId);
  const encodedFileName = encodeURIComponent(fileName);
  const path = `/api/command-commandDeck/arms/${encodedArmId}/files/${encodedFileName}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildDeckTodoToggleUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const path = `/api/command-commandDeck/arms/${encodeURIComponent(armId)}/todo/toggle`;
  if (!runtimeBaseUrl) return path;
  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildDeckTodoEditUrl = (armId: string, runtimeBaseUrl = readRuntimeBaseUrl()) => {
  const path = `/api/command-commandDeck/arms/${encodeURIComponent(armId)}/todo/edit`;
  if (!runtimeBaseUrl) return path;
  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildDeckTodoAddUrl = (armId: string, runtimeBaseUrl = readRuntimeBaseUrl()) => {
  const path = `/api/command-commandDeck/arms/${encodeURIComponent(armId)}/todo`;
  if (!runtimeBaseUrl) return path;
  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildDeckTodoDeleteUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const path = `/api/command-commandDeck/arms/${encodeURIComponent(armId)}/todo/delete`;
  if (!runtimeBaseUrl) return path;
  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildDeckTodoSolveUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
) => {
  const path = `/api/command-commandDeck/arms/${encodeURIComponent(armId)}/todo/solve`;
  if (!runtimeBaseUrl) return path;
  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildPromptsUrl = (runtimeBaseUrl = readRuntimeBaseUrl()) => {
  if (!runtimeBaseUrl) {
    return "/api/prompts";
  }

  return buildAbsoluteUrl(runtimeBaseUrl, "/api/prompts");
};

export const buildPromptItemUrl = (name: string, runtimeBaseUrl = readRuntimeBaseUrl()) => {
  const encodedName = encodeURIComponent(name);
  const path = `/api/prompts/${encodedName}`;
  if (!runtimeBaseUrl) {
    return path;
  }

  return buildAbsoluteUrl(runtimeBaseUrl, path);
};

export const buildTerminalSocketUrl = (
  armId: string,
  runtimeBaseUrl = readRuntimeBaseUrl(),
  location: LocationLike = window.location,
) => {
  const encodedArmId = encodeURIComponent(armId);
  if (!runtimeBaseUrl) {
    return localWebSocketUrl(location, encodedArmId);
  }

  const webSocketBase = toWebSocketBase(runtimeBaseUrl);
  if (!webSocketBase) {
    return localWebSocketUrl(location, encodedArmId);
  }

  return buildAbsoluteUrl(webSocketBase, `/api/terminals/${encodedArmId}/ws`);
};
