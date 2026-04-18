import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  CommandDeckAvailableSkill,
  CommandDeckArmSummary,
  WorkspaceSetupSnapshot,
  WorkspaceSetupStepId,
} from "@kraken/core";
import { useClickOutside } from "../app/hooks/useClickOutside";
import type { TerminalAgentProvider } from "../app/types";
import {
  buildDeckSkillsUrl,
  buildDeckArmSkillsUrl,
  buildDeckArmUrl,
  buildDeckArmsUrl,
  buildDeckTodoToggleUrl,
  buildDeckVaultFileUrl,
  buildTerminalsUrl,
} from "../runtime/runtimeEndpoints";
import { KrakenGlyph } from "./EmptyKraken";
import { Terminal } from "./Terminal";
import { ActionCards } from "./commandDeck/ActionCards";
import { AddArmForm } from "./commandDeck/AddArmForm";
import type { KrakenAppearancePayload } from "./commandDeck/AddArmForm";
import { CommandDeckBottomActions } from "./commandDeck/CommandDeckBottomActions";
import { ArmPod } from "./commandDeck/ArmPod";
import { WorkspaceSetupCard } from "./commandDeck/WorkspaceSetupCard";
import { type KrakenVisuals, deriveKrakenVisuals } from "./commandDeck/krakenVisuals";
import { MarkdownContent } from "./ui/MarkdownContent";

export type { KrakenAppearancePayload } from "./commandDeck/AddArmForm";

const normalizeCommandDeckAvailableSkill = (value: unknown): CommandDeckAvailableSkill | null => {
  if (value === null || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.name !== "string") return null;

  return {
    name: record.name,
    description: typeof record.description === "string" ? record.description : "",
    source: record.source === "project" ? "project" : "user",
  };
};

// ─── Main view ───────────────────────────────────────────────────────────────

type FocusState =
  | { type: "vault-browser"; armId: string }
  | { type: "vault"; armId: string; fileName: string }
  | { type: "terminal"; agentId: string; terminalLabel: string };

type EmptyViewMode = "idle" | "adding";

type CommandDeckPrimaryViewProps = {
  onSidebarContent?: ((content: ReactNode) => void) | undefined;
  workspaceSetup: WorkspaceSetupSnapshot | null;
  isWorkspaceSetupLoading: boolean;
  workspaceSetupError: string | null;
  onRefreshWorkspaceSetup: () => Promise<WorkspaceSetupSnapshot | null>;
  onRunWorkspaceSetupStep: (stepId: WorkspaceSetupStepId) => Promise<WorkspaceSetupSnapshot | null>;
  suppressWorkspaceSetupCard?: boolean;
};

export const CommandDeckPrimaryView = ({
  onSidebarContent,
  workspaceSetup,
  isWorkspaceSetupLoading,
  workspaceSetupError,
  onRefreshWorkspaceSetup,
  onRunWorkspaceSetupStep,
  suppressWorkspaceSetupCard = false,
}: CommandDeckPrimaryViewProps) => {
  const [arms, setArms] = useState<CommandDeckArmSummary[]>([]);
  const [focus, setFocus] = useState<FocusState | null>(null);
  const [vaultContent, setVaultContent] = useState<string | null>(null);
  const [loadingVault, setLoadingVault] = useState(false);
  const [emptyViewMode, setEmptyViewMode] = useState<EmptyViewMode>("idle");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<CommandDeckAvailableSkill[]>([]);
  const [savingArmSkillsId, setSavingArmSkillsId] = useState<string | null>(null);

  const [selectedAgent, setSelectedAgent] = useState<TerminalAgentProvider>("claude-code");
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const agentMenuRef = useRef<HTMLDivElement>(null);
  const [isLaunchingAgent, setIsLaunchingAgent] = useState(false);
  const [runningSetupStepId, setRunningSetupStepId] = useState<
    | "initialize-workspace"
    | "ensure-gitignore"
    | "check-claude"
    | "check-git"
    | "check-curl"
    | "create-arms"
    | null
  >(null);

  // Fetch arm list
  const fetchArms = useCallback(async () => {
    try {
      const response = await fetch(buildDeckArmsUrl(), {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const data = await response.json();
      setArms(data);
      await onRefreshWorkspaceSetup();
    } catch {
      // silently ignore
    }
  }, [onRefreshWorkspaceSetup]);

  useEffect(() => {
    void fetchArms();
  }, [fetchArms]);

  useEffect(() => {
    let cancelled = false;

    const fetchSkills = async () => {
      try {
        const response = await fetch(buildDeckSkillsUrl(), {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const payload = (await response.json()) as unknown;
        if (!Array.isArray(payload) || cancelled) return;
        const skills = payload
          .map((entry) => normalizeCommandDeckAvailableSkill(entry))
          .filter((entry): entry is CommandDeckAvailableSkill => entry !== null);
        if (!cancelled) {
          setAvailableSkills(skills);
        }
      } catch {
        // silently ignore
      }
    };

    void fetchSkills();
    return () => {
      cancelled = true;
    };
  }, []);

  // Precompute visuals for all arms
  const visualsMap = useMemo(() => {
    const map = new Map<string, KrakenVisuals>();
    for (const t of arms) {
      map.set(t.armId, deriveKrakenVisuals(t));
    }
    return map;
  }, [arms]);

  // Fetch vault file content when focus changes
  useEffect(() => {
    if (!focus || focus.type !== "vault") {
      setVaultContent(null);
      return;
    }

    let cancelled = false;
    setLoadingVault(true);
    const fetchVault = async () => {
      try {
        const response = await fetch(buildDeckVaultFileUrl(focus.armId, focus.fileName), {
          headers: { Accept: "text/markdown" },
        });
        if (cancelled) return;
        if (!response.ok) {
          setVaultContent(null);
          setLoadingVault(false);
          return;
        }
        const text = await response.text();
        if (!cancelled) {
          setVaultContent(text);
          setLoadingVault(false);
        }
      } catch {
        if (!cancelled) {
          setVaultContent(null);
          setLoadingVault(false);
        }
      }
    };
    void fetchVault();
    return () => {
      cancelled = true;
    };
  }, [focus]);

  // Agent menu click-outside/escape
  const handleDismissAgentMenu = useCallback(() => setAgentMenuOpen(false), []);
  useClickOutside(agentMenuRef, agentMenuOpen, handleDismissAgentMenu);

  const handleVaultFileClick = useCallback((armId: string, fileName: string) => {
    setFocus({ type: "vault", armId, fileName });
  }, []);

  const handleClose = useCallback(() => {
    setFocus(null);
  }, []);

  const handleLaunchAgent = useCallback(async () => {
    setIsLaunchingAgent(true);
    try {
      const response = await fetch(buildTerminalsUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: "arm-planner",
          workspaceMode: "shared",
          agentProvider: selectedAgent,
          promptTemplate: "arm-planner",
        }),
      });
      if (!response.ok) return;
      const data = await response.json();
      const agentId = (data.terminalId ?? data.armId) as string;
      setFocus({ type: "terminal", agentId, terminalLabel: "Arm Planner" });
      await fetchArms();
    } catch {
      // silently ignore
    } finally {
      setIsLaunchingAgent(false);
    }
  }, [selectedAgent, fetchArms]);

  const handleRunSetupStep = useCallback(
    async (
      stepId:
        | "initialize-workspace"
        | "ensure-gitignore"
        | "check-claude"
        | "check-git"
        | "check-curl"
        | "create-arms",
    ) => {
      setRunningSetupStepId(stepId);
      try {
        await onRunWorkspaceSetupStep(stepId);
        if (stepId === "initialize-workspace" || stepId === "ensure-gitignore") {
          await fetchArms();
        }
      } finally {
        setRunningSetupStepId(null);
      }
    },
    [fetchArms, onRunWorkspaceSetupStep],
  );

  const handleCreateArm = useCallback(
    async (
      name: string,
      description: string,
      color: string,
      octopus: KrakenAppearancePayload,
      suggestedSkills: string[],
    ) => {
      setIsCreating(true);
      setCreateError(null);
      try {
        const response = await fetch(buildDeckArmsUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name, description, color, octopus, suggestedSkills }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const msg =
            body && typeof body === "object" && "error" in body && typeof body.error === "string"
              ? body.error
              : "Failed to create arm";
          setCreateError(msg);
          return;
        }
        setEmptyViewMode("idle");
        await fetchArms();
        await onRefreshWorkspaceSetup();
      } catch {
        setCreateError("Network error");
      } finally {
        setIsCreating(false);
      }
    },
    [fetchArms, onRefreshWorkspaceSetup],
  );

  const handleArmSkillsSave = useCallback(
    async (armId: string, suggestedSkills: string[]) => {
      setSavingArmSkillsId(armId);
      try {
        const response = await fetch(buildDeckArmSkillsUrl(armId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ suggestedSkills }),
        });
        if (!response.ok) return false;
        await fetchArms();
        return true;
      } catch {
        return false;
      } finally {
        setSavingArmSkillsId((current) => (current === armId ? null : current));
      }
    },
    [fetchArms],
  );

  const [deletingArmId, setDeletingArmId] = useState<string | null>(null);

  const handleDeleteArm = useCallback(
    async (armId: string) => {
      setDeletingArmId(armId);
      try {
        const response = await fetch(buildDeckArmUrl(armId), { method: "DELETE" });
        if (!response.ok) return;
        await fetchArms();
      } catch {
        // silently ignore
      } finally {
        setDeletingArmId(null);
      }
    },
    [fetchArms],
  );

  const handleTodoToggle = useCallback(
    async (armId: string, itemIndex: number, done: boolean) => {
      try {
        const response = await fetch(buildDeckTodoToggleUrl(armId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIndex, done }),
        });
        if (!response.ok) return;
        await fetchArms();
      } catch {
        // silently ignore
      }
    },
    [fetchArms],
  );

  const focusedArm =
    focus?.type === "vault" || focus?.type === "vault-browser"
      ? arms.find((t) => t.armId === focus.armId)
      : null;
  const mode = focus ? "detail" : "grid";
  const shouldShowWorkspaceSetup =
    !suppressWorkspaceSetupCard && arms.length === 0 && workspaceSetup?.shouldShowSetupCard;

  // Push sidebar content to the shared sidebar
  const sidebarContent = useMemo(
    () =>
      arms.length > 0 || focus?.type === "terminal" || shouldShowWorkspaceSetup ? (
        <div className="commandDeck-sidebar-content">
          <div className="commandDeck-sidebar-content-top">
            {shouldShowWorkspaceSetup ? (
              <WorkspaceSetupCard
                compact
                workspaceSetup={workspaceSetup}
                isLoading={isWorkspaceSetupLoading}
                error={workspaceSetupError}
                onRunStep={handleRunSetupStep}
                onLaunchClaudeCode={handleLaunchAgent}
                isLaunchingAgent={isLaunchingAgent}
                isRunningStepId={runningSetupStepId}
              />
            ) : (
              <ActionCards
                compact
                selectedAgent={selectedAgent}
                setSelectedAgent={setSelectedAgent}
                agentMenuOpen={agentMenuOpen}
                setAgentMenuOpen={setAgentMenuOpen}
                agentMenuRef={agentMenuRef}
                onAddManually={() => {
                  setEmptyViewMode("adding");
                  setCreateError(null);
                }}
                onLaunchAgent={handleLaunchAgent}
                isLaunchingAgent={isLaunchingAgent}
              />
            )}
          </div>
          {arms.length > 0 && (
            <div className="commandDeck-sidebar-content-bottom">
              <CommandDeckBottomActions
                onClearAll={async () => {
                  for (const t of arms) {
                    await fetch(buildDeckArmUrl(t.armId), { method: "DELETE" });
                  }
                  await fetchArms();
                }}
              />
            </div>
          )}
        </div>
      ) : null,
    [
      agentMenuOpen,
      fetchArms,
      focus?.type,
      handleLaunchAgent,
      handleRunSetupStep,
      isLaunchingAgent,
      isWorkspaceSetupLoading,
      runningSetupStepId,
      selectedAgent,
      shouldShowWorkspaceSetup,
      arms,
      workspaceSetup,
      workspaceSetupError,
    ],
  );

  useEffect(() => {
    onSidebarContent?.(sidebarContent);
    return () => onSidebarContent?.(null);
  }, [onSidebarContent, sidebarContent]);

  // ─── Empty state (no arms) ─────────────────────────────────────────────

  if (arms.length === 0 && focus?.type !== "terminal") {
    return (
      <section
        className="commandDeck-view"
        data-mode="grid"
        data-empty-mode={emptyViewMode}
        aria-label="CommandDeck"
      >
        <div className="commandDeck-empty-state">
          <div className="commandDeck-empty-left">
            <div className="commandDeck-empty-octopus">
              <KrakenGlyph
                color="#d4a017"
                animation="walk"
                expression="happy"
                accessory="none"
                scale={20}
              />
            </div>
            {shouldShowWorkspaceSetup ? (
              <WorkspaceSetupCard
                workspaceSetup={workspaceSetup}
                isLoading={isWorkspaceSetupLoading}
                error={workspaceSetupError}
                onRunStep={handleRunSetupStep}
                onLaunchClaudeCode={handleLaunchAgent}
                isLaunchingAgent={isLaunchingAgent}
                isRunningStepId={runningSetupStepId}
              />
            ) : (
              <ActionCards
                selectedAgent={selectedAgent}
                setSelectedAgent={setSelectedAgent}
                agentMenuOpen={agentMenuOpen}
                setAgentMenuOpen={setAgentMenuOpen}
                agentMenuRef={agentMenuRef}
                onAddManually={() => {
                  setEmptyViewMode("adding");
                  setCreateError(null);
                }}
                onLaunchAgent={handleLaunchAgent}
                isLaunchingAgent={isLaunchingAgent}
              />
            )}
          </div>
          {emptyViewMode === "adding" && (
            <div className="commandDeck-empty-right">
              <AddArmForm
                onSubmit={handleCreateArm}
                onCancel={() => setEmptyViewMode("idle")}
                isSubmitting={isCreating}
                error={createError}
                availableSkills={availableSkills}
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  // ─── Populated state ────────────────────────────────────────────────────────

  return (
    <section
      className="commandDeck-view"
      data-mode={mode}
      data-has-pods={arms.length > 0}
      aria-label="CommandDeck"
    >
      <div className="commandDeck-pods-container">
        {arms.map((t) => {
          const isThis =
            (focus?.type === "vault" || focus?.type === "vault-browser") &&
            focus.armId === t.armId;
          return (
            <div
              key={t.armId}
              className="commandDeck-pod-slot"
              data-pod-role={isThis ? "focused" : focus ? "other" : "idle"}
            >
              <ArmPod
                arm={t}
                visuals={visualsMap.get(t.armId) as KrakenVisuals}
                isFocused={isThis}
                activeFileName={focus?.type === "vault" && isThis ? focus.fileName : undefined}
                onVaultFileClick={(fileName) =>
                  setFocus({ type: "vault", armId: t.armId, fileName })
                }
                onVaultBrowse={() => setFocus({ type: "vault-browser", armId: t.armId })}
                onClose={handleClose}
                onDelete={() => handleDeleteArm(t.armId)}
                isDeleting={deletingArmId === t.armId}
                onTodoToggle={handleTodoToggle}
                availableSkills={availableSkills}
                isSavingSkills={savingArmSkillsId === t.armId}
                onSaveSuggestedSkills={handleArmSkillsSave}
              />
            </div>
          );
        })}
      </div>

      <div className="commandDeck-detail-main">
        {focus?.type === "vault-browser" && focusedArm && (
          <>
            <header className="commandDeck-detail-main-header">
              <button type="button" className="commandDeck-add-form-back" onClick={handleClose}>
                ← Back
              </button>
              <span className="commandDeck-detail-main-path">
                <strong>{focusedArm.displayName}</strong> / vault
              </span>
            </header>
            <div className="commandDeck-detail-main-content commandDeck-vault-browser">
              <pre className="commandDeck-vault-tree">
                <span className="commandDeck-vault-tree-dir">
                  .kraken/arms/{focusedArm.armId}/
                </span>
                {(() => {
                  const files = [...focusedArm.vaultFiles, "CONTEXT.md"];
                  return files.map((file, i) => {
                    const isLast = i === files.length - 1;
                    const prefix = isLast ? "└── " : "├── ";
                    return (
                      <span key={file} className="commandDeck-vault-tree-row">
                        <span className="commandDeck-vault-tree-branch">{prefix}</span>
                        <button
                          type="button"
                          className="commandDeck-vault-tree-file"
                          onClick={() =>
                            setFocus({
                              type: "vault",
                              armId: focus.armId,
                              fileName: file,
                            })
                          }
                        >
                          {file}
                        </button>
                      </span>
                    );
                  });
                })()}
              </pre>
            </div>
          </>
        )}
        {focus?.type === "vault" && focusedArm && (
          <>
            <header className="commandDeck-detail-main-header">
              <button
                type="button"
                className="commandDeck-add-form-back"
                onClick={() => setFocus({ type: "vault-browser", armId: focus.armId })}
              >
                ← Back
              </button>
              <span className="commandDeck-detail-main-path">
                {focusedArm.displayName} / <strong>{focus.fileName}</strong>
              </span>
            </header>
            <div className="commandDeck-detail-main-content" key={`${focus.armId}/${focus.fileName}`}>
              {loadingVault ? (
                <span className="commandDeck-detail-loading">Loading…</span>
              ) : vaultContent !== null ? (
                <MarkdownContent content={vaultContent} className="commandDeck-detail-markdown" />
              ) : (
                <span className="commandDeck-detail-loading">File not found.</span>
              )}
            </div>
          </>
        )}
        {focus?.type === "terminal" && (
          <div className="commandDeck-detail-terminal" key={focus.agentId}>
            <header className="commandDeck-detail-main-header">
              <button type="button" className="commandDeck-add-form-back" onClick={handleClose}>
                ← Back
              </button>
              <span className="commandDeck-detail-main-path">
                <strong>{focus.terminalLabel}</strong>
              </span>
            </header>
            <Terminal terminalId={focus.agentId} terminalLabel={focus.terminalLabel} />
          </div>
        )}
      </div>
    </section>
  );
};
