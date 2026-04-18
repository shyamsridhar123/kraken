import type { PendingDeleteTerminal } from "../app/hooks/useTerminalMutations";
import type {
  ArmGitStatusSnapshot,
  ArmPullRequestSnapshot,
  TerminalView,
} from "../app/types";
import { DeleteArmDialog } from "./DeleteArmDialog";
import { ArmGitActionsDialog } from "./ArmGitActionsDialog";

type SidebarActionPanelProps = {
  pendingDeleteTerminal: PendingDeleteTerminal | null;
  isDeletingTerminalId: string | null;
  clearPendingDeleteTerminal: () => void;
  confirmDeleteTerminal: () => Promise<void>;
  openGitArmId: string | null;
  columns: TerminalView;
  openGitArmStatus: ArmGitStatusSnapshot | null;
  openGitArmPullRequest: ArmPullRequestSnapshot | null;
  gitCommitMessageDraft: string;
  gitDialogError: string | null;
  isGitDialogLoading: boolean;
  isGitDialogMutating: boolean;
  setGitCommitMessageDraft: (value: string) => void;
  closeArmGitActions: () => void;
  commitArmChanges: () => Promise<void>;
  commitAndPushArmBranch: () => Promise<void>;
  pushArmBranch: () => Promise<void>;
  syncArmBranch: () => Promise<void>;
  mergeArmPullRequest: () => Promise<void>;
  requestDeleteTerminal: (
    armId: string,
    armName: string,
    options: {
      workspaceMode: "shared" | "worktree";
      intent: "delete-terminal" | "cleanup-worktree";
    },
  ) => void;
};

export const SidebarActionPanel = ({
  pendingDeleteTerminal,
  isDeletingTerminalId,
  clearPendingDeleteTerminal,
  confirmDeleteTerminal,
  openGitArmId,
  columns,
  openGitArmStatus,
  openGitArmPullRequest,
  gitCommitMessageDraft,
  gitDialogError,
  isGitDialogLoading,
  isGitDialogMutating,
  setGitCommitMessageDraft,
  closeArmGitActions,
  commitArmChanges,
  commitAndPushArmBranch,
  pushArmBranch,
  syncArmBranch,
  mergeArmPullRequest,
  requestDeleteTerminal,
}: SidebarActionPanelProps) => {
  const openGitArmTerminal =
    openGitArmId !== null
      ? columns.find((terminal) => terminal.armId === openGitArmId)
      : null;

  if (pendingDeleteTerminal) {
    return (
      <DeleteArmDialog
        isDeletingTerminalId={isDeletingTerminalId}
        onCancel={clearPendingDeleteTerminal}
        onConfirmDelete={() => {
          void confirmDeleteTerminal();
        }}
        pendingDeleteTerminal={pendingDeleteTerminal}
      />
    );
  }

  if (openGitArmTerminal && openGitArmTerminal.workspaceMode === "worktree") {
    return (
      <ArmGitActionsDialog
        errorMessage={gitDialogError}
        gitCommitMessage={gitCommitMessageDraft}
        gitPullRequest={openGitArmPullRequest}
        gitStatus={openGitArmStatus}
        isLoading={isGitDialogLoading}
        isMutating={isGitDialogMutating}
        onClose={closeArmGitActions}
        onCommit={() => {
          void commitArmChanges();
        }}
        onCommitAndPush={() => {
          void commitAndPushArmBranch();
        }}
        onCommitMessageChange={setGitCommitMessageDraft}
        onMergePullRequest={() => {
          void mergeArmPullRequest();
        }}
        onPush={() => {
          void pushArmBranch();
        }}
        onSync={() => {
          void syncArmBranch();
        }}
        onCleanupWorktree={() => {
          requestDeleteTerminal(
            openGitArmTerminal.terminalId,
            openGitArmTerminal.armName ?? openGitArmTerminal.armId,
            {
              workspaceMode: openGitArmTerminal.workspaceMode ?? "shared",
              intent: "cleanup-worktree",
            },
          );
          closeArmGitActions();
        }}
        armId={openGitArmTerminal.armId}
        armName={openGitArmTerminal.armName ?? openGitArmTerminal.armId}
      />
    );
  }

  return null;
};
