import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  buildArmGitCommitUrl,
  buildArmGitPullRequestMergeUrl,
  buildArmGitPullRequestUrl,
  buildArmGitPushUrl,
  buildArmGitStatusUrl,
  buildArmGitSyncUrl,
} from "../../runtime/runtimeEndpoints";
import type {
  ArmGitStatusSnapshot,
  ArmPullRequestSnapshot,
  TerminalView,
} from "../types";

type UseArmGitLifecycleOptions = {
  columns: TerminalView;
};

type UseArmGitLifecycleResult = {
  gitStatusByArmId: Record<string, ArmGitStatusSnapshot>;
  gitStatusLoadingByArmId: Record<string, boolean>;
  pullRequestByArmId: Record<string, ArmPullRequestSnapshot>;
  pullRequestLoadingByArmId: Record<string, boolean>;
  openGitArmId: string | null;
  openGitArmStatus: ArmGitStatusSnapshot | null;
  openGitArmPullRequest: ArmPullRequestSnapshot | null;
  gitCommitMessageDraft: string;
  gitDialogError: string | null;
  isGitDialogLoading: boolean;
  isGitDialogMutating: boolean;
  setGitCommitMessageDraft: Dispatch<SetStateAction<string>>;
  openArmGitActions: (armId: string) => void;
  closeArmGitActions: () => void;
  commitArmChanges: () => Promise<void>;
  commitAndPushArmBranch: () => Promise<void>;
  pushArmBranch: () => Promise<void>;
  syncArmBranch: () => Promise<void>;
  mergeArmPullRequest: () => Promise<void>;
};

const parseGitError = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error.trim().length > 0) {
      return payload.error.trim();
    }
  } catch {
    return fallback;
  }

  return fallback;
};

const parseArmGitStatus = (payload: unknown): ArmGitStatusSnapshot | null => {
  if (payload === null || payload === undefined || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record.armId !== "string" ||
    (record.workspaceMode !== "shared" && record.workspaceMode !== "worktree") ||
    typeof record.branchName !== "string" ||
    (record.upstreamBranchName !== null && typeof record.upstreamBranchName !== "string") ||
    typeof record.isDirty !== "boolean" ||
    typeof record.aheadCount !== "number" ||
    typeof record.behindCount !== "number" ||
    typeof record.hasConflicts !== "boolean" ||
    !Array.isArray(record.changedFiles) ||
    !record.changedFiles.every((file) => typeof file === "string") ||
    (record.defaultBaseBranchName !== null && typeof record.defaultBaseBranchName !== "string")
  ) {
    return null;
  }

  return {
    armId: record.armId,
    workspaceMode: record.workspaceMode,
    branchName: record.branchName,
    upstreamBranchName: record.upstreamBranchName,
    isDirty: record.isDirty,
    aheadCount: record.aheadCount,
    behindCount: record.behindCount,
    insertedLineCount: typeof record.insertedLineCount === "number" ? record.insertedLineCount : 0,
    deletedLineCount: typeof record.deletedLineCount === "number" ? record.deletedLineCount : 0,
    hasConflicts: record.hasConflicts,
    changedFiles: [...record.changedFiles],
    defaultBaseBranchName: record.defaultBaseBranchName,
  };
};

const parseArmPullRequest = (payload: unknown): ArmPullRequestSnapshot | null => {
  if (payload === null || payload === undefined || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record.armId !== "string" ||
    (record.workspaceMode !== "shared" && record.workspaceMode !== "worktree") ||
    (record.status !== "none" &&
      record.status !== "open" &&
      record.status !== "merged" &&
      record.status !== "closed") ||
    (record.number !== null && typeof record.number !== "number") ||
    (record.url !== null && typeof record.url !== "string") ||
    (record.title !== null && typeof record.title !== "string") ||
    (record.baseRef !== null && typeof record.baseRef !== "string") ||
    (record.headRef !== null && typeof record.headRef !== "string") ||
    (record.isDraft !== null && typeof record.isDraft !== "boolean") ||
    (record.mergeable !== null &&
      record.mergeable !== "MERGEABLE" &&
      record.mergeable !== "CONFLICTING" &&
      record.mergeable !== "UNKNOWN") ||
    (record.mergeStateStatus !== null && typeof record.mergeStateStatus !== "string")
  ) {
    return null;
  }

  return {
    armId: record.armId,
    workspaceMode: record.workspaceMode,
    status: record.status,
    number: record.number,
    url: record.url,
    title: record.title,
    baseRef: record.baseRef,
    headRef: record.headRef,
    isDraft: record.isDraft,
    mergeable: record.mergeable,
    mergeStateStatus: record.mergeStateStatus,
  };
};

export const useArmGitLifecycle = ({
  columns,
}: UseArmGitLifecycleOptions): UseArmGitLifecycleResult => {
  const [gitStatusByArmId, setGitStatusByArmId] = useState<
    Record<string, ArmGitStatusSnapshot>
  >({});
  const [gitStatusLoadingByArmId, setGitStatusLoadingByArmId] = useState<
    Record<string, boolean>
  >({});
  const [gitStatusAttemptedArmIds, setGitStatusAttemptedArmIds] = useState<
    Record<string, boolean>
  >({});
  const [pullRequestByArmId, setPullRequestByArmId] = useState<
    Record<string, ArmPullRequestSnapshot>
  >({});
  const [pullRequestLoadingByArmId, setPullRequestLoadingByArmId] = useState<
    Record<string, boolean>
  >({});
  const [pullRequestAttemptedArmIds, setPullRequestAttemptedArmIds] = useState<
    Record<string, boolean>
  >({});
  const [openGitArmId, setOpenGitArmId] = useState<string | null>(null);
  const [gitCommitMessageDraft, setGitCommitMessageDraft] = useState("");
  const [gitDialogError, setGitDialogError] = useState<string | null>(null);
  const [isGitDialogMutating, setIsGitDialogMutating] = useState(false);

  const fetchArmGitStatus = useCallback(async (armId: string) => {
    setGitStatusLoadingByArmId((current) => ({
      ...current,
      [armId]: true,
    }));

    try {
      const response = await fetch(buildArmGitStatusUrl(armId), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        const errorMessage = await parseGitError(
          response,
          `Unable to fetch git status (${response.status}).`,
        );
        throw new Error(errorMessage);
      }

      const payload = parseArmGitStatus(await response.json());
      if (!payload) {
        throw new Error("Unable to parse git status response.");
      }

      setGitStatusByArmId((current) => ({
        ...current,
        [armId]: payload,
      }));
      return payload;
    } finally {
      setGitStatusLoadingByArmId((current) => ({
        ...current,
        [armId]: false,
      }));
    }
  }, []);

  const fetchArmPullRequest = useCallback(async (armId: string) => {
    setPullRequestLoadingByArmId((current) => ({
      ...current,
      [armId]: true,
    }));

    try {
      const response = await fetch(buildArmGitPullRequestUrl(armId), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        const errorMessage = await parseGitError(
          response,
          `Unable to fetch pull request status (${response.status}).`,
        );
        throw new Error(errorMessage);
      }

      const payload = parseArmPullRequest(await response.json());
      if (!payload) {
        throw new Error("Unable to parse pull request response.");
      }

      setPullRequestByArmId((current) => ({
        ...current,
        [armId]: payload,
      }));
      return payload;
    } finally {
      setPullRequestLoadingByArmId((current) => ({
        ...current,
        [armId]: false,
      }));
    }
  }, []);

  const worktreeArmIds = useMemo(
    () =>
      columns
        .filter((column) => column.workspaceMode === "worktree")
        .map((column) => column.armId),
    [columns],
  );

  useEffect(() => {
    const activeArmIds = new Set(columns.map((column) => column.armId));
    setGitStatusByArmId((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([armId]) => activeArmIds.has(armId)),
      ),
    );
    setGitStatusLoadingByArmId((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([armId]) => activeArmIds.has(armId)),
      ),
    );
    setGitStatusAttemptedArmIds((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([armId]) => activeArmIds.has(armId)),
      ),
    );
    setPullRequestByArmId((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([armId]) => activeArmIds.has(armId)),
      ),
    );
    setPullRequestLoadingByArmId((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([armId]) => activeArmIds.has(armId)),
      ),
    );
    setPullRequestAttemptedArmIds((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([armId]) => activeArmIds.has(armId)),
      ),
    );
    if (openGitArmId && !activeArmIds.has(openGitArmId)) {
      setOpenGitArmId(null);
      setGitDialogError(null);
      setGitCommitMessageDraft("");
    }
  }, [columns, openGitArmId]);

  useEffect(() => {
    for (const armId of worktreeArmIds) {
      if (gitStatusAttemptedArmIds[armId]) {
        continue;
      }

      setGitStatusAttemptedArmIds((current) => ({
        ...current,
        [armId]: true,
      }));
      void fetchArmGitStatus(armId).catch((error: unknown) => {
        console.warn(`[git] Failed to fetch status for arm ${armId}:`, error);
      });
    }
  }, [fetchArmGitStatus, gitStatusAttemptedArmIds, worktreeArmIds]);

  useEffect(() => {
    for (const armId of worktreeArmIds) {
      if (pullRequestAttemptedArmIds[armId]) {
        continue;
      }

      setPullRequestAttemptedArmIds((current) => ({
        ...current,
        [armId]: true,
      }));
      void fetchArmPullRequest(armId).catch((error: unknown) => {
        console.warn(`[git] Failed to fetch pull request for arm ${armId}:`, error);
      });
    }
  }, [fetchArmPullRequest, pullRequestAttemptedArmIds, worktreeArmIds]);

  const openArmGitActions = useCallback(
    (armId: string) => {
      setOpenGitArmId(armId);
      setGitDialogError(null);
      setGitCommitMessageDraft("");

      void Promise.all([
        fetchArmGitStatus(armId),
        fetchArmPullRequest(armId),
      ]).catch((error: unknown) => {
        setGitDialogError(
          error instanceof Error ? error.message : "Unable to fetch git lifecycle data.",
        );
      });
    },
    [fetchArmGitStatus, fetchArmPullRequest],
  );

  const closeArmGitActions = useCallback(() => {
    setOpenGitArmId(null);
    setGitDialogError(null);
    setGitCommitMessageDraft("");
  }, []);

  const runGitMutation = useCallback(
    async (
      action: "commit" | "push" | "sync",
      request: { body?: string; headers?: Record<string, string> } = {},
    ): Promise<ArmGitStatusSnapshot | null> => {
      if (!openGitArmId) {
        return null;
      }

      const endpoint =
        action === "commit"
          ? buildArmGitCommitUrl(openGitArmId)
          : action === "push"
            ? buildArmGitPushUrl(openGitArmId)
            : buildArmGitSyncUrl(openGitArmId);

      setIsGitDialogMutating(true);
      setGitDialogError(null);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...request.headers,
          },
          body: request.body ?? null,
        });

        if (!response.ok) {
          const errorMessage = await parseGitError(
            response,
            `Unable to ${action} (${response.status}).`,
          );
          throw new Error(errorMessage);
        }

        const payload = parseArmGitStatus(await response.json());
        if (!payload) {
          throw new Error("Unable to parse git lifecycle response.");
        }

        setGitStatusByArmId((current) => ({
          ...current,
          [openGitArmId]: payload,
        }));
        return payload;
      } catch (error) {
        setGitDialogError(
          error instanceof Error ? error.message : `Unable to ${action} arm worktree.`,
        );
        return null;
      } finally {
        setIsGitDialogMutating(false);
      }
    },
    [openGitArmId],
  );

  const runPullRequestMutation = useCallback(
    async (request: { body?: string; headers?: Record<string, string> } = {}) => {
      if (!openGitArmId) {
        return;
      }

      const endpoint = buildArmGitPullRequestMergeUrl(openGitArmId);

      setIsGitDialogMutating(true);
      setGitDialogError(null);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...request.headers,
          },
          body: request.body ?? null,
        });

        if (!response.ok) {
          const errorMessage = await parseGitError(
            response,
            `Unable to merge pull request (${response.status}).`,
          );
          throw new Error(errorMessage);
        }

        const payload = parseArmPullRequest(await response.json());
        if (!payload) {
          throw new Error("Unable to parse pull request response.");
        }

        setPullRequestByArmId((current) => ({
          ...current,
          [openGitArmId]: payload,
        }));
      } catch (error) {
        setGitDialogError(error instanceof Error ? error.message : "Unable to merge pull request.");
      } finally {
        setIsGitDialogMutating(false);
      }
    },
    [openGitArmId],
  );

  const commitArmChanges = useCallback(async () => {
    const message = gitCommitMessageDraft.trim();
    if (message.length === 0) {
      setGitDialogError("Commit message cannot be empty.");
      return;
    }

    const committed = await runGitMutation("commit", {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    if (committed) {
      setGitCommitMessageDraft("");
    }
  }, [gitCommitMessageDraft, runGitMutation]);

  const commitAndPushArmBranch = useCallback(async () => {
    const message = gitCommitMessageDraft.trim();
    if (message.length === 0) {
      setGitDialogError("Commit message cannot be empty.");
      return;
    }

    const committed = await runGitMutation("commit", {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    if (!committed) {
      return;
    }
    setGitCommitMessageDraft("");
    await runGitMutation("push");
  }, [gitCommitMessageDraft, runGitMutation]);

  const pushArmBranch = useCallback(async () => {
    await runGitMutation("push");
  }, [runGitMutation]);

  const syncArmBranch = useCallback(async () => {
    await runGitMutation("sync");
  }, [runGitMutation]);

  const mergeArmPullRequest = useCallback(async () => {
    await runPullRequestMutation();
  }, [runPullRequestMutation]);

  const openGitArmStatus =
    openGitArmId !== null ? (gitStatusByArmId[openGitArmId] ?? null) : null;
  const openGitArmPullRequest =
    openGitArmId !== null ? (pullRequestByArmId[openGitArmId] ?? null) : null;
  const isGitDialogLoading =
    openGitArmId !== null
      ? (gitStatusLoadingByArmId[openGitArmId] ?? false) ||
        (pullRequestLoadingByArmId[openGitArmId] ?? false)
      : false;

  return {
    gitStatusByArmId,
    gitStatusLoadingByArmId,
    pullRequestByArmId,
    pullRequestLoadingByArmId,
    openGitArmId,
    openGitArmStatus,
    openGitArmPullRequest,
    gitCommitMessageDraft,
    gitDialogError,
    isGitDialogLoading,
    isGitDialogMutating,
    setGitCommitMessageDraft,
    openArmGitActions,
    closeArmGitActions,
    commitArmChanges,
    commitAndPushArmBranch,
    pushArmBranch,
    syncArmBranch,
    mergeArmPullRequest,
  };
};
