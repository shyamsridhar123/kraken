import type { ArmWorkspaceMode } from "./terminal.js";

export type ArmPullRequestStatus = "none" | "open" | "merged" | "closed";

export type ArmGitStatusSnapshot = {
  armId: string;
  workspaceMode: ArmWorkspaceMode;
  branchName: string;
  upstreamBranchName: string | null;
  isDirty: boolean;
  aheadCount: number;
  behindCount: number;
  insertedLineCount: number;
  deletedLineCount: number;
  hasConflicts: boolean;
  changedFiles: string[];
  defaultBaseBranchName: string | null;
};

export type ArmPullRequestSnapshot = {
  armId: string;
  workspaceMode: ArmWorkspaceMode;
  status: ArmPullRequestStatus;
  number: number | null;
  url: string | null;
  title: string | null;
  baseRef: string | null;
  headRef: string | null;
  isDraft: boolean | null;
  mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN" | null;
  mergeStateStatus: string | null;
};
