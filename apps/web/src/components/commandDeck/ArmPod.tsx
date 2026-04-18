import { useEffect, useRef, useState } from "react";

import type { CommandDeckAvailableSkill, CommandDeckArmSummary } from "@kraken/core";
import { KrakenGlyph } from "../EmptyKraken";
import type { KrakenVisuals } from "./krakenVisuals";

// ─── Status styling ──────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<CommandDeckArmSummary["status"], string> = {
  idle: "idle",
  active: "active",
  blocked: "blocked",
  "needs-review": "review",
};

// ─── TodoList ────────────────────────────────────────────────────────────────

export const TodoList = ({
  items,
  armId,
  onToggle,
}: {
  items: { text: string; done: boolean }[];
  armId: string;
  onToggle?: ((armId: string, itemIndex: number, done: boolean) => void) | undefined;
}) => {
  let lastDoneIndex = -1;
  for (let idx = items.length - 1; idx >= 0; idx--) {
    if (items[idx]?.done) {
      lastDoneIndex = idx;
      break;
    }
  }
  const scrollRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <ul className="commandDeck-pod-todos">
      {items.map((item, i) => (
        <li
          key={item.text}
          ref={i === lastDoneIndex ? scrollRef : undefined}
          className={`commandDeck-pod-todo-item${item.done ? " commandDeck-pod-todo-item--done" : ""}`}
        >
          <input
            type="checkbox"
            checked={item.done}
            className="commandDeck-pod-todo-checkbox"
            onChange={() => onToggle?.(armId, i, !item.done)}
          />
          <span className="commandDeck-pod-todo-text">{item.text}</span>
        </li>
      ))}
    </ul>
  );
};

// ─── ArmPod ─────────────────────────────────────────────────────────────

export type ArmPodProps = {
  arm: CommandDeckArmSummary;
  visuals: KrakenVisuals;
  isFocused: boolean;
  activeFileName?: string | undefined;
  onVaultFileClick?: (fileName: string) => void;
  onVaultBrowse?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean | undefined;
  onTodoToggle?: (armId: string, itemIndex: number, done: boolean) => void;
  availableSkills: CommandDeckAvailableSkill[];
  isSavingSkills?: boolean | undefined;
  onSaveSuggestedSkills?:
    | ((armId: string, suggestedSkills: string[]) => Promise<boolean>)
    | undefined;
};

export const ArmPod = ({
  arm,
  visuals,
  isFocused,
  activeFileName,
  onVaultFileClick,
  onVaultBrowse,
  onClose,
  onDelete,
  isDeleting,
  onTodoToggle,
  availableSkills,
  isSavingSkills,
  onSaveSuggestedSkills,
}: ArmPodProps) => {
  const progressPct =
    arm.todoTotal > 0 ? Math.round((arm.todoDone / arm.todoTotal) * 100) : 0;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [draftSkills, setDraftSkills] = useState<string[]>(arm.suggestedSkills);

  useEffect(() => {
    setDraftSkills(arm.suggestedSkills);
  }, [arm.suggestedSkills]);

  const availableSkillNames = availableSkills.map((skill) => skill.name);
  const skillNames = [...new Set([...availableSkillNames, ...draftSkills])].sort((a, b) =>
    a.localeCompare(b),
  );

  const toggleSkill = (skillName: string) => {
    setDraftSkills((current) =>
      current.includes(skillName)
        ? current.filter((skill) => skill !== skillName)
        : [...current, skillName].sort((a, b) => a.localeCompare(b)),
    );
  };

  const handleSaveSkills = async () => {
    const saved = await onSaveSuggestedSkills?.(arm.armId, draftSkills);
    if (saved) {
      setIsEditingSkills(false);
    }
  };

  return (
    <article
      className={`commandDeck-pod${isFocused ? " commandDeck-pod--focused" : ""}`}
      data-status={arm.status}
      style={{ borderColor: "var(--accent-primary)" }}
    >
      <header className="commandDeck-pod-header">
        {isFocused && (
          <button type="button" className="commandDeck-pod-btn commandDeck-pod-btn--secondary" onClick={onClose}>
            ← Back
          </button>
        )}
        <button type="button" className="commandDeck-pod-btn">
          Spawn
        </button>
        <button
          type="button"
          className="commandDeck-pod-btn"
          onClick={() => {
            setDraftSkills(arm.suggestedSkills);
            setIsEditingSkills((current) => !current);
          }}
        >
          Skills
        </button>
        <button type="button" className="commandDeck-pod-btn" onClick={() => onVaultBrowse?.()}>
          Vault
        </button>
        {confirmingDelete ? (
          <>
            <button
              type="button"
              className="commandDeck-pod-btn commandDeck-pod-btn--danger"
              disabled={isDeleting}
              onClick={() => onDelete?.()}
            >
              {isDeleting ? "..." : "Confirm Delete"}
            </button>
            <button
              type="button"
              className="commandDeck-pod-btn commandDeck-pod-btn--secondary"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="commandDeck-pod-btn commandDeck-pod-btn--delete"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete arm"
          >
            <svg className="commandDeck-pod-btn-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M5.5 1.5h5M2 4h12M6 7v5M10 7v5M3.5 4l.75 9.5a1 1 0 001 .9h5.5a1 1 0 001-.9L12.5 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </header>

      <div className="commandDeck-pod-body">
        <span className={`commandDeck-pod-status commandDeck-pod-status--${arm.status}`}>
          {STATUS_LABELS[arm.status]}
        </span>
        <div className="commandDeck-pod-identity">
          <div className="commandDeck-pod-octopus-col">
            <div className="commandDeck-pod-octopus">
              <KrakenGlyph
                color={visuals.color}
                animation={visuals.animation}
                expression={visuals.expression}
                accessory={visuals.accessory}
                {...(visuals.hairColor ? { hairColor: visuals.hairColor } : {})}
                scale={5}
              />
            </div>
          </div>
          <div className="commandDeck-pod-identity-text">
            <span className="commandDeck-pod-name">{arm.displayName}</span>
            <span className="commandDeck-pod-description">{arm.description}</span>
          </div>
        </div>

        <div className="commandDeck-pod-details">
          {isEditingSkills && (
            <div className="commandDeck-pod-skills-editor">
              {skillNames.length === 0 ? (
                <span className="commandDeck-pod-skills-empty">No Claude Code skills found.</span>
              ) : (
                <div className="commandDeck-pod-skills-options">
                  {skillNames.map((skillName) => {
                    const skill = availableSkills.find((entry) => entry.name === skillName);
                    return (
                      <label key={skillName} className="commandDeck-pod-skill-option">
                        <input
                          type="checkbox"
                          checked={draftSkills.includes(skillName)}
                          onChange={() => toggleSkill(skillName)}
                        />
                        <span className="commandDeck-pod-skill-copy">
                          <span className="commandDeck-pod-skill-name">{skillName}</span>
                          {skill?.description && (
                            <span className="commandDeck-pod-skill-desc">{skill.description}</span>
                          )}
                          {!skill && (
                            <span className="commandDeck-pod-skill-desc">
                              Stored on this arm, but not available right now.
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="commandDeck-pod-skills-actions">
                <button
                  type="button"
                  className="commandDeck-pod-btn commandDeck-pod-btn--secondary"
                  onClick={() => {
                    setDraftSkills(arm.suggestedSkills);
                    setIsEditingSkills(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="commandDeck-pod-btn"
                  disabled={Boolean(isSavingSkills)}
                  onClick={() => void handleSaveSkills()}
                >
                  {isSavingSkills ? "Saving..." : "Save Skills"}
                </button>
              </div>
            </div>
          )}

          {arm.todoTotal > 0 && (
            <div className="commandDeck-pod-progress">
              <div className="commandDeck-pod-progress-bar">
                <div
                  className="commandDeck-pod-progress-fill"
                  style={{ width: `${progressPct}%`, backgroundColor: visuals.color }}
                />
              </div>
              <span
                className="commandDeck-pod-progress-label"
                style={{ backgroundColor: `${visuals.color}22`, color: visuals.color }}
              >
                {arm.todoDone}/{arm.todoTotal} done
              </span>
            </div>
          )}

          {arm.todoItems.length > 0 && (
            <TodoList
              items={arm.todoItems}
              armId={arm.armId}
              onToggle={onTodoToggle}
            />
          )}

          {arm.suggestedSkills.length > 0 && (
            <div className="commandDeck-pod-vault">
              <span className="commandDeck-pod-vault-label">skills</span>
              <div className="commandDeck-pod-vault-files">
                {arm.suggestedSkills.map((skill) => (
                  <span key={skill} className="commandDeck-pod-vault-file">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {arm.vaultFiles.length > 0 && (
            <div className="commandDeck-pod-vault">
              <span className="commandDeck-pod-vault-label">vault</span>
              <div className="commandDeck-pod-vault-files">
                {arm.vaultFiles.map((file) => (
                  <button
                    key={file}
                    type="button"
                    className="commandDeck-pod-vault-file"
                    aria-current={activeFileName === file ? "true" : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      onVaultFileClick?.(file);
                    }}
                  >
                    {file}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
