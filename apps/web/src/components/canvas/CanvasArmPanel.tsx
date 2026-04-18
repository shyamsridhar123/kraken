import { Terminal, X } from "lucide-react";
import { type Ref, useCallback, useMemo, useState } from "react";

import type { CommandDeckArmSummary, ArmWorkspaceMode } from "@kraken/core";
import type { GraphNode } from "../../app/canvas/types";
import type { ConversationSessionSummary } from "../../app/types";
import {
  buildDeckTodoAddUrl,
  buildDeckTodoDeleteUrl,
  buildDeckTodoEditUrl,
  buildDeckTodoSolveUrl,
  buildDeckTodoToggleUrl,
} from "../../runtime/runtimeEndpoints";
import {
  type KrakenAccessory,
  type KrakenAnimation,
  type KrakenExpression,
  KrakenGlyph,
} from "../EmptyKraken";

const KRAKEN_COLORS = [
  "#ff6b2b",
  "#ff2d6b",
  "#00ffaa",
  "#bf5fff",
  "#00c8ff",
  "#ffee00",
  "#39ff14",
  "#ff4df0",
  "#00fff7",
  "#ff9500",
];
const ANIMATIONS: KrakenAnimation[] = ["sway", "walk", "jog", "bounce", "float", "swim-up"];
const EXPRESSIONS: KrakenExpression[] = ["normal", "happy", "angry", "surprised"];
const ACCESSORIES: KrakenAccessory[] = ["none", "none", "long", "mohawk", "side-sweep", "curly"];

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function deriveVisuals(arm: CommandDeckArmSummary) {
  const rng = seededRng(hashStr(arm.armId));
  const stored = arm.octopus;
  return {
    color:
      arm.color ??
      (KRAKEN_COLORS[hashStr(arm.armId) % KRAKEN_COLORS.length] as string),
    animation:
      (stored?.animation as KrakenAnimation | null) ??
      (ANIMATIONS[Math.floor(rng() * ANIMATIONS.length)] as KrakenAnimation),
    expression:
      (stored?.expression as KrakenExpression | null) ??
      (EXPRESSIONS[Math.floor(rng() * EXPRESSIONS.length)] as KrakenExpression),
    accessory:
      (stored?.accessory as KrakenAccessory | null) ??
      (ACCESSORIES[Math.floor(rng() * ACCESSORIES.length)] as KrakenAccessory),
    hairColor: stored?.hairColor ?? undefined,
  };
}

type CanvasArmPanelProps = {
  node: GraphNode;
  isFocused?: boolean;
  onClose: () => void;
  onFocus?: () => void;
  panelRef?: Ref<HTMLDivElement> | undefined;
  arm: CommandDeckArmSummary | null;
  sessions: ConversationSessionSummary[];
  onCreateAgent?: ((armId: string) => void) | undefined;
  onSolveTodoItem?: ((armId: string, itemIndex: number) => void) | undefined;
  onSpawnFleet?: ((armId: string, workspaceMode: ArmWorkspaceMode) => void) | undefined;
  onNavigateToConversation?: ((sessionId: string) => void) | undefined;
  onRefreshArmData?: (() => Promise<void>) | undefined;
};

const STATUS_LABELS: Record<string, string> = {
  idle: "idle",
  active: "active",
  blocked: "blocked",
  "needs-review": "review",
};

const formatTime = (isoString: string | null): string => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

export const CanvasArmPanel = ({
  node,
  isFocused,
  onClose,
  onFocus,
  panelRef,
  arm,
  sessions,
  onCreateAgent,
  onSolveTodoItem,
  onSpawnFleet,
  onNavigateToConversation,
  onRefreshArmData,
}: CanvasArmPanelProps) => {
  const visuals = useMemo(() => (arm ? deriveVisuals(arm) : null), [arm]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [addingTodo, setAddingTodo] = useState(false);
  const [addText, setAddText] = useState("");
  const [solvingTodoIndex, setSolvingTodoIndex] = useState<number | null>(null);
  const refreshArmData = useCallback(async () => {
    await onRefreshArmData?.();
  }, [onRefreshArmData]);

  const handleTodoToggle = useCallback(
    async (itemIndex: number, done: boolean) => {
      try {
        const response = await fetch(buildDeckTodoToggleUrl(node.armId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIndex, done }),
        });
        if (!response.ok) return;
        await refreshArmData();
      } catch {
        // silent
      }
    },
    [node.armId, refreshArmData],
  );

  const handleTodoEdit = useCallback(
    async (itemIndex: number, text: string) => {
      if (text.trim().length === 0) return;
      try {
        const response = await fetch(buildDeckTodoEditUrl(node.armId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIndex, text: text.trim() }),
        });
        if (!response.ok) return;
        setEditingIndex(null);
        await refreshArmData();
      } catch {
        // silent
      }
    },
    [node.armId, refreshArmData],
  );

  const handleTodoAdd = useCallback(
    async (text: string) => {
      if (text.trim().length === 0) return;
      try {
        const response = await fetch(buildDeckTodoAddUrl(node.armId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
        if (!response.ok) return;
        setAddingTodo(false);
        setAddText("");
        await refreshArmData();
      } catch {
        // silent
      }
    },
    [node.armId, refreshArmData],
  );

  const handleTodoDelete = useCallback(
    async (itemIndex: number) => {
      try {
        const response = await fetch(buildDeckTodoDeleteUrl(node.armId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIndex }),
        });
        if (!response.ok) return;
        await refreshArmData();
      } catch {
        // silent
      }
    },
    [node.armId, refreshArmData],
  );

  const handleTodoSolve = useCallback(
    async (itemIndex: number) => {
      try {
        setSolvingTodoIndex(itemIndex);
        const response = await fetch(buildDeckTodoSolveUrl(node.armId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIndex }),
        });
        if (!response.ok) return;
        onSolveTodoItem?.(node.armId, itemIndex);
      } catch {
        // silent
      } finally {
        setSolvingTodoIndex((current) => (current === itemIndex ? null : current));
      }
    },
    [node.armId, onSolveTodoItem],
  );

  const progressPct =
    arm && arm.todoTotal > 0
      ? Math.round((arm.todoDone / arm.todoTotal) * 100)
      : 0;

  return (
    <div
      ref={panelRef}
      className={`detail-panel${isFocused ? " detail-panel--focused" : ""}`}
      tabIndex={-1}
      onPointerDown={() => onFocus?.()}
    >
      {/* Header */}
      <div
        className="detail-panel-header"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${node.color ?? "var(--accent-primary)"} 90%, #ffd89d 10%) 0%, color-mix(in srgb, ${node.color ?? "var(--accent-primary)"} 78%, #d9851c 22%) 100%)`,
        }}
      >
        <span className="detail-title">{arm?.displayName ?? node.label}</span>
        {arm && (
          <span className="detail-type-badge">
            {STATUS_LABELS[arm.status] ?? arm.status}
          </span>
        )}
        <button className="detail-close" type="button" onClick={onClose} aria-label="Close panel">
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="detail-content">
        {/* Identity: glyph + info side by side */}
        <div className="detail-identity">
          {visuals && (
            <div className="detail-glyph">
              <KrakenGlyph
                color={visuals.color}
                animation={visuals.animation}
                expression={visuals.expression}
                accessory={visuals.accessory}
                {...(visuals.hairColor ? { hairColor: visuals.hairColor } : {})}
                scale={6}
              />
            </div>
          )}
          <div className="detail-identity-info">
            <div className="detail-name">{arm?.displayName ?? node.label}</div>
            <div className="detail-row">
              <span className="detail-label">ID</span>
              <span className="detail-value detail-value--mono">{node.armId}</span>
            </div>
            {arm?.description && (
              <div className="detail-row">
                <span className="detail-label">Description</span>
                <span className="detail-value">{arm.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions section */}
        <div className="detail-section">
          <div className="detail-section-title">Actions</div>
          <div className="detail-actions">
            <button
              type="button"
              className="detail-action-btn"
              onClick={() => onCreateAgent?.(node.armId)}
            >
              &gt;_ Create Agent
            </button>
            <button
              type="button"
              className="detail-action-btn"
              onClick={() => onSpawnFleet?.(node.armId, "worktree")}
            >
              &#x2263; Spawn Fleet (Worktrees)
            </button>
            <button
              type="button"
              className="detail-action-btn"
              onClick={() => onSpawnFleet?.(node.armId, "shared")}
            >
              &#x2263; Spawn Fleet (Normal)
            </button>
          </div>
        </div>

        {/* Progress section */}
        {arm && (
          <div className="detail-section">
            <div className="detail-section-title">Progress</div>
            {arm.todoTotal > 0 && (
              <div className="detail-progress">
                <div className="detail-progress-bar">
                  <div
                    className="detail-progress-fill"
                    style={{ width: `${progressPct}%`, backgroundColor: node.color }}
                  />
                </div>
                <span className="detail-progress-label">
                  {arm.todoDone}/{arm.todoTotal}
                </span>
              </div>
            )}
            {arm.todoItems.length > 0 && (
              <ul className="detail-todos">
                {arm.todoItems.map((item, i) => (
                  <li
                    key={`${i}-${item.text}`}
                    className={`detail-todo${item.done ? " detail-todo--done" : ""}`}
                  >
                    <div className="detail-todo-controls">
                      <button
                        type="button"
                        className="detail-todo-delete"
                        title="Delete item"
                        onClick={() => void handleTodoDelete(i)}
                      >
                        <X size={12} />
                      </button>
                      <button
                        type="button"
                        className="detail-todo-solve"
                        aria-label={`Spawn agent for todo item: ${item.text}`}
                        title="Spawn agent for this item"
                        disabled={item.done || solvingTodoIndex === i}
                        onClick={() => void handleTodoSolve(i)}
                      >
                        {solvingTodoIndex === i ? "…" : <Terminal size={15} strokeWidth={2.4} />}
                      </button>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleTodoToggle(i, !item.done)}
                      />
                    </div>
                    {editingIndex === i ? (
                      <input
                        className="detail-todo-edit-input"
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleTodoEdit(i, editText);
                          if (e.key === "Escape") setEditingIndex(null);
                        }}
                        onBlur={() => void handleTodoEdit(i, editText)}
                      />
                    ) : (
                      <span
                        className="detail-todo-text"
                        onDoubleClick={() => {
                          setEditingIndex(i);
                          setEditText(item.text);
                        }}
                      >
                        {item.text}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {addingTodo ? (
              <div className="detail-todo-add-row">
                <input
                  className="detail-todo-edit-input"
                  type="text"
                  placeholder="New todo item…"
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleTodoAdd(addText);
                    if (e.key === "Escape") {
                      setAddingTodo(false);
                      setAddText("");
                    }
                  }}
                  onBlur={() => {
                    if (addText.trim().length > 0) {
                      void handleTodoAdd(addText);
                    } else {
                      setAddingTodo(false);
                      setAddText("");
                    }
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                className="detail-todo-add-btn"
                onClick={() => setAddingTodo(true)}
              >
                + Add item
              </button>
            )}
          </div>
        )}

        {/* Vault files */}
        {arm && arm.vaultFiles.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Vault Files</div>
            <div className="detail-labels-list">
              {arm.vaultFiles.map((file) => (
                <span key={file} className="detail-label-tag">
                  {file}
                </span>
              ))}
            </div>
          </div>
        )}

        {arm && arm.suggestedSkills.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Suggested Skills</div>
            <div className="detail-labels-list">
              {arm.suggestedSkills.map((skill) => (
                <span key={skill} className="detail-label-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sessions section */}
        <div className="detail-section">
          <div className="detail-section-title">Sessions ({sessions.length})</div>
          {sessions.length === 0 ? (
            <div className="detail-empty">No sessions yet</div>
          ) : (
            <div className="detail-sessions">
              {sessions.map((s) => (
                <button
                  key={s.sessionId}
                  type="button"
                  className="detail-session-item"
                  onClick={() => onNavigateToConversation?.(s.sessionId)}
                >
                  <span className="detail-session-preview">
                    {s.firstUserTurnPreview
                      ? s.firstUserTurnPreview.slice(0, 60)
                      : s.sessionId.slice(0, 16)}
                  </span>
                  <span className="detail-session-meta">
                    {s.turnCount} turns · {formatTime(s.lastEventAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
