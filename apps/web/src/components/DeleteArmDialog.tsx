import { useEffect, useState } from "react";

import type { PendingDeleteTerminal } from "../app/hooks/useTerminalMutations";
import { ConfirmationDialog } from "./ui/ConfirmationDialog";

type DeleteArmDialogProps = {
  pendingDeleteTerminal: PendingDeleteTerminal;
  isDeletingTerminalId: string | null;
  onCancel: () => void;
  onConfirmDelete: () => void;
};

export const DeleteArmDialog = ({
  pendingDeleteTerminal,
  isDeletingTerminalId,
  onCancel,
  onConfirmDelete,
}: DeleteArmDialogProps) => {
  const [cleanupConfirmationInput, setCleanupConfirmationInput] = useState("");
  const isCleanupIntent =
    pendingDeleteTerminal.intent === "cleanup-worktree" &&
    pendingDeleteTerminal.workspaceMode === "worktree";
  const isCleanupConfirmationValid =
    !isCleanupIntent || cleanupConfirmationInput.trim() === pendingDeleteTerminal.terminalId;
  const isDeleting = isDeletingTerminalId !== null;
  const isThisDeleting = isDeletingTerminalId === pendingDeleteTerminal.terminalId;
  const dialogResetKey = `${pendingDeleteTerminal.terminalId}:${pendingDeleteTerminal.intent}`;

  useEffect(() => {
    void dialogResetKey;
    setCleanupConfirmationInput("");
  }, [dialogResetKey]);

  return (
    <ConfirmationDialog
      title={isCleanupIntent ? "Cleanup Worktree Arm" : "Delete Arm"}
      ariaLabel={`Delete confirmation for ${pendingDeleteTerminal.terminalId}`}
      message={
        isCleanupIntent ? (
          <>
            Cleanup <strong>{pendingDeleteTerminal.armName}</strong> and delete the arm
            session metadata.
          </>
        ) : (
          <>
            Delete <strong>{pendingDeleteTerminal.armName}</strong> and terminate all of its
            active sessions.
          </>
        )
      }
      warning={
        isCleanupIntent
          ? "This action removes the worktree directory and local branch."
          : "This action cannot be undone."
      }
      confirmLabel={isThisDeleting ? "Deleting..." : isCleanupIntent ? "Cleanup" : "Delete"}
      isConfirmDisabled={isDeleting || !isCleanupConfirmationValid}
      isBusy={isDeleting}
      cancelAriaLabel="Cancel delete"
      onCancel={onCancel}
      onConfirm={onConfirmDelete}
    >
      <dl className="delete-confirm-details">
        <div>
          <dt>Name</dt>
          <dd>{pendingDeleteTerminal.armName}</dd>
        </div>
        <div>
          <dt>ID</dt>
          <dd>{pendingDeleteTerminal.terminalId}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{pendingDeleteTerminal.workspaceMode === "worktree" ? "worktree" : "shared"}</dd>
        </div>
      </dl>
      {isCleanupIntent && (
        <div className="delete-confirm-typed-check">
          <label htmlFor="cleanup-confirm-id-input">Type arm ID to confirm cleanup</label>
          <input
            aria-label="Type arm ID to confirm cleanup"
            id="cleanup-confirm-id-input"
            onChange={(event) => setCleanupConfirmationInput(event.target.value)}
            type="text"
            value={cleanupConfirmationInput}
          />
        </div>
      )}
    </ConfirmationDialog>
  );
};
