import { describe, expect, it } from "vitest";

import {
  buildClaudeUsageUrl,
  buildCodexUsageUrl,
  buildConversationExportUrl,
  buildConversationSessionUrl,
  buildConversationsUrl,
  buildGithubSummaryUrl,
  buildMonitorConfigUrl,
  buildMonitorFeedUrl,
  buildMonitorRefreshUrl,
  buildArmGitCommitUrl,
  buildArmGitPullRequestMergeUrl,
  buildArmGitPullRequestUrl,
  buildArmGitPushUrl,
  buildArmGitStatusUrl,
  buildArmGitSyncUrl,
  buildArmRenameUrl,
  buildTerminalEventsSocketUrl,
  buildTerminalSnapshotsUrl,
  buildTerminalSocketUrl,
  buildTerminalsUrl,
  buildUiStateUrl,
  buildWorkspaceSetupStepUrl,
  buildWorkspaceSetupUrl,
} from "../src/runtime/runtimeEndpoints";

describe("runtimeEndpoints", () => {
  it("returns same-origin API path when runtime base URL is not configured", () => {
    expect(buildTerminalSnapshotsUrl()).toBe("/api/terminal-snapshots");
  });

  it("builds absolute API URL when runtime base URL is configured", () => {
    expect(buildTerminalSnapshotsUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/terminal-snapshots",
    );
  });

  it("builds terminal creation URL on same origin by default", () => {
    expect(buildTerminalsUrl()).toBe("/api/terminals");
  });

  it("builds absolute terminal creation URL when runtime base URL is configured", () => {
    expect(buildTerminalsUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/terminals",
    );
  });

  it("builds codex usage URL on same origin by default", () => {
    expect(buildCodexUsageUrl()).toBe("/api/codex/usage");
  });

  it("builds absolute codex usage URL when runtime base URL is configured", () => {
    expect(buildCodexUsageUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/codex/usage",
    );
  });

  it("builds claude usage URL on same origin by default", () => {
    expect(buildClaudeUsageUrl()).toBe("/api/claude/usage");
  });

  it("builds absolute claude usage URL when runtime base URL is configured", () => {
    expect(buildClaudeUsageUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/claude/usage",
    );
  });

  it("builds github summary URL on same origin by default", () => {
    expect(buildGithubSummaryUrl()).toBe("/api/github/summary");
  });

  it("builds absolute github summary URL when runtime base URL is configured", () => {
    expect(buildGithubSummaryUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/github/summary",
    );
  });

  it("builds monitor config URL on same origin by default", () => {
    expect(buildMonitorConfigUrl()).toBe("/api/monitor/config");
  });

  it("builds monitor feed URL on same origin by default", () => {
    expect(buildMonitorFeedUrl()).toBe("/api/monitor/feed");
  });

  it("builds monitor refresh URL on same origin by default", () => {
    expect(buildMonitorRefreshUrl()).toBe("/api/monitor/refresh");
  });

  it("builds conversations URLs on same origin by default", () => {
    expect(buildConversationsUrl()).toBe("/api/conversations");
    expect(buildConversationSessionUrl("arm-1-root")).toBe(
      "/api/conversations/arm-1-root",
    );
    expect(buildConversationExportUrl("arm-1-root", "json")).toBe(
      "/api/conversations/arm-1-root/export?format=json",
    );
    expect(buildConversationExportUrl("arm-1-root", "md")).toBe(
      "/api/conversations/arm-1-root/export?format=md",
    );
  });

  it("builds absolute conversations URLs when runtime base URL is configured", () => {
    expect(buildConversationsUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/conversations",
    );
    expect(buildConversationSessionUrl("arm-1-root", "https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/conversations/arm-1-root",
    );
    expect(
      buildConversationExportUrl("arm-1-root", "json", "https://runtime.example.com"),
    ).toBe("https://runtime.example.com/api/conversations/arm-1-root/export?format=json");
  });

  it("builds absolute monitor URLs when runtime base URL is configured", () => {
    expect(buildMonitorConfigUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/monitor/config",
    );
    expect(buildMonitorFeedUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/monitor/feed",
    );
    expect(buildMonitorRefreshUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/monitor/refresh",
    );
  });

  it("builds ui state URL on same origin by default", () => {
    expect(buildUiStateUrl()).toBe("/api/ui-state");
  });

  it("builds absolute ui state URL when runtime base URL is configured", () => {
    expect(buildUiStateUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/ui-state",
    );
  });

  it("builds workspace setup URLs on same origin by default", () => {
    expect(buildWorkspaceSetupUrl()).toBe("/api/setup");
    expect(buildWorkspaceSetupStepUrl("ensure-gitignore")).toBe(
      "/api/setup/steps/ensure-gitignore",
    );
  });

  it("builds absolute workspace setup URLs when runtime base URL is configured", () => {
    expect(buildWorkspaceSetupUrl("https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/setup",
    );
    expect(buildWorkspaceSetupStepUrl("ensure-gitignore", "https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/setup/steps/ensure-gitignore",
    );
  });

  it("builds arm rename URL on same origin by default", () => {
    expect(buildArmRenameUrl("arm-main")).toBe("/api/arms/arm-main");
  });

  it("builds absolute arm rename URL when runtime base URL is configured", () => {
    expect(buildArmRenameUrl("arm-main", "https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/arms/arm-main",
    );
  });

  it("builds arm git lifecycle URLs on same origin by default", () => {
    expect(buildArmGitStatusUrl("arm-main")).toBe(
      "/api/arms/arm-main/git/status",
    );
    expect(buildArmGitCommitUrl("arm-main")).toBe(
      "/api/arms/arm-main/git/commit",
    );
    expect(buildArmGitPushUrl("arm-main")).toBe("/api/arms/arm-main/git/push");
    expect(buildArmGitSyncUrl("arm-main")).toBe("/api/arms/arm-main/git/sync");
    expect(buildArmGitPullRequestUrl("arm-main")).toBe(
      "/api/arms/arm-main/git/pr",
    );
    expect(buildArmGitPullRequestMergeUrl("arm-main")).toBe(
      "/api/arms/arm-main/git/pr/merge",
    );
  });

  it("builds absolute arm git lifecycle URLs when runtime base URL is configured", () => {
    expect(buildArmGitStatusUrl("arm-main", "https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/arms/arm-main/git/status",
    );
    expect(buildArmGitCommitUrl("arm-main", "https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/arms/arm-main/git/commit",
    );
    expect(buildArmGitPushUrl("arm-main", "https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/arms/arm-main/git/push",
    );
    expect(buildArmGitSyncUrl("arm-main", "https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/arms/arm-main/git/sync",
    );
    expect(buildArmGitPullRequestUrl("arm-main", "https://runtime.example.com")).toBe(
      "https://runtime.example.com/api/arms/arm-main/git/pr",
    );
    expect(
      buildArmGitPullRequestMergeUrl("arm-main", "https://runtime.example.com"),
    ).toBe("https://runtime.example.com/api/arms/arm-main/git/pr/merge");
  });

  it("builds same-origin websocket URL by default", () => {
    expect(
      buildTerminalSocketUrl(
        "arm-main",
        undefined,
        new URL("https://workspace.example.com/dashboard") as unknown as Location,
      ),
    ).toBe("wss://workspace.example.com/api/terminals/arm-main/ws");
  });

  it("builds websocket URL from configured runtime base URL", () => {
    expect(
      buildTerminalSocketUrl(
        "arm-main",
        "http://127.0.0.1:8787",
        new URL("https://workspace.example.com/dashboard") as unknown as Location,
      ),
    ).toBe("ws://127.0.0.1:8787/api/terminals/arm-main/ws");
  });

  it("builds same-origin terminal events websocket URL by default", () => {
    expect(
      buildTerminalEventsSocketUrl(
        undefined,
        new URL("https://workspace.example.com/dashboard") as unknown as Location,
      ),
    ).toBe("wss://workspace.example.com/api/terminal-events/ws");
  });

  it("builds terminal events websocket URL from configured runtime base URL", () => {
    expect(
      buildTerminalEventsSocketUrl(
        "http://127.0.0.1:8787",
        new URL("https://workspace.example.com/dashboard") as unknown as Location,
      ),
    ).toBe("ws://127.0.0.1:8787/api/terminal-events/ws");
  });
});
