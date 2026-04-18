import { useCallback, useEffect, useRef, useState } from "react";

import type { CommandDeckArmSummary } from "@kraken/core";
import { buildConversationsUrl, buildDeckArmsUrl } from "../../runtime/runtimeEndpoints";
import type { GraphEdge, GraphNode } from "../canvas/types";
import { normalizeConversationSessionSummary } from "../conversationNormalizers";
import type { ConversationSessionSummary, TerminalView } from "../types";
import type { AgentRuntimeStateInfo } from "./useAgentRuntimeStates";

const ARM_RADIUS = 40;
const ACTIVE_SESSION_RADIUS = 12;
const INACTIVE_SESSION_RADIUS = 10;

const CAPTAIN_RADIUS = 52;
export const CAPTAIN_ID = "__captain__";
const CAPTAIN_NODE_ID = `t:${CAPTAIN_ID}`;

const getAccentPrimary = (): string =>
  (typeof document !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue("--accent-primary").trim()
    : "") || "#d4a017";

// Must match the CommandDeck tab's OCTOPUS_COLORS for consistent arm colors
const OCTOPUS_COLORS = [
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

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const armColor = (armId: string, commandDeckColor: string | null | undefined) =>
  commandDeckColor && commandDeckColor.length > 0
    ? commandDeckColor
    : (OCTOPUS_COLORS[hashString(armId) % OCTOPUS_COLORS.length] as string);

type UseCanvasGraphDataOptions = {
  columns: TerminalView;
  enabled: boolean;
  agentRuntimeStates?: Map<string, AgentRuntimeStateInfo>;
};

type UseCanvasGraphDataResult = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  armById: ReadonlyMap<string, CommandDeckArmSummary>;
  sessionsByArmId: ReadonlyMap<string, ConversationSessionSummary[]>;
  refresh: () => Promise<void>;
  refreshCommandDeckArms: () => Promise<void>;
};

const buildArmNodeId = (armId: string) => `t:${armId}`;
const buildActiveSessionNodeId = (agentId: string) => `a:${agentId}`;
const buildInactiveSessionNodeId = (sessionId: string) => `i:${sessionId}`;

const normalizeCommandDeckArmSummary = (value: unknown): CommandDeckArmSummary | null => {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.armId !== "string") {
    return null;
  }

  const todoItems = Array.isArray(record.todoItems)
    ? record.todoItems
        .map((item) => {
          if (item === null || typeof item !== "object") {
            return null;
          }

          const todoRecord = item as Record<string, unknown>;
          if (typeof todoRecord.text !== "string") {
            return null;
          }

          return {
            text: todoRecord.text,
            done: todoRecord.done === true,
          };
        })
        .filter((item): item is { text: string; done: boolean } => item !== null)
    : [];

  const scopeRecord =
    record.scope !== null && typeof record.scope === "object"
      ? (record.scope as Record<string, unknown>)
      : null;
  const octopusRecord =
    record.octopus !== null && typeof record.octopus === "object"
      ? (record.octopus as Record<string, unknown>)
      : null;

  const status =
    record.status === "idle" ||
    record.status === "active" ||
    record.status === "blocked" ||
    record.status === "needs-review"
      ? record.status
      : "idle";

  return {
    armId: record.armId,
    displayName: typeof record.displayName === "string" ? record.displayName : record.armId,
    description: typeof record.description === "string" ? record.description : "",
    status,
    color: typeof record.color === "string" ? record.color : null,
    octopus: {
      animation: typeof octopusRecord?.animation === "string" ? octopusRecord.animation : null,
      expression: typeof octopusRecord?.expression === "string" ? octopusRecord.expression : null,
      accessory: typeof octopusRecord?.accessory === "string" ? octopusRecord.accessory : null,
      hairColor: typeof octopusRecord?.hairColor === "string" ? octopusRecord.hairColor : null,
    },
    scope: {
      paths: Array.isArray(scopeRecord?.paths)
        ? scopeRecord.paths.filter((path): path is string => typeof path === "string")
        : [],
      tags: Array.isArray(scopeRecord?.tags)
        ? scopeRecord.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
    },
    vaultFiles: Array.isArray(record.vaultFiles)
      ? record.vaultFiles.filter((file): file is string => typeof file === "string")
      : [],
    todoTotal:
      typeof record.todoTotal === "number" && Number.isFinite(record.todoTotal)
        ? record.todoTotal
        : todoItems.length,
    todoDone:
      typeof record.todoDone === "number" && Number.isFinite(record.todoDone)
        ? record.todoDone
        : todoItems.filter((item) => item.done).length,
    todoItems,
    suggestedSkills: Array.isArray(record.suggestedSkills)
      ? record.suggestedSkills.filter((skill): skill is string => typeof skill === "string")
      : [],
  };
};

export const useCanvasGraphData = ({
  columns,
  enabled,
  agentRuntimeStates,
}: UseCanvasGraphDataOptions): UseCanvasGraphDataResult => {
  const [commandDeckArms, setCommandDeckArms] = useState<CommandDeckArmSummary[]>([]);
  const [inactiveSessions, setInactiveSessions] = useState<ConversationSessionSummary[]>([]);
  const prevNodesRef = useRef<Map<string, GraphNode>>(new Map());

  const fetchCommandDeckArms = useCallback(async () => {
    try {
      const response = await fetch(buildDeckArmsUrl(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const payload = (await response.json()) as unknown;
      if (!Array.isArray(payload)) return;
      const items = payload
        .map((entry) => normalizeCommandDeckArmSummary(entry))
        .filter((entry): entry is CommandDeckArmSummary => entry !== null);
      setCommandDeckArms(items);
    } catch {
      // silent
    }
  }, []);

  const fetchInactiveSessions = useCallback(async () => {
    try {
      const response = await fetch(buildConversationsUrl(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const payload = (await response.json()) as unknown;
      const normalized = Array.isArray(payload)
        ? payload
            .map((entry) => normalizeConversationSessionSummary(entry))
            .filter((entry): entry is ConversationSessionSummary => entry !== null)
        : [];
      setInactiveSessions(normalized);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCommandDeckArms([]);
      setInactiveSessions([]);
      return;
    }
    void fetchCommandDeckArms();
    void fetchInactiveSessions();
  }, [enabled, fetchCommandDeckArms, fetchInactiveSessions]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchCommandDeckArms(), fetchInactiveSessions()]);
  }, [fetchCommandDeckArms, fetchInactiveSessions]);
  const refreshCommandDeckArms = useCallback(async () => {
    await fetchCommandDeckArms();
  }, [fetchCommandDeckArms]);

  const activeTerminalIds = new Set(columns.map((terminal) => terminal.terminalId));

  // Build a map of commandDeck arms for color/label lookup
  const commandDeckMap = new Map<string, CommandDeckArmSummary>();
  for (const dt of commandDeckArms) {
    commandDeckMap.set(dt.armId, dt);
  }

  const sessionsByArmId = new Map<string, ConversationSessionSummary[]>();
  for (const session of inactiveSessions) {
    if (!session.armId) {
      continue;
    }
    const armSessions = sessionsByArmId.get(session.armId);
    if (armSessions) {
      armSessions.push(session);
    } else {
      sessionsByArmId.set(session.armId, [session]);
    }
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const prevNodes = prevNodesRef.current;
  const currentNodesById = new Map<string, GraphNode>();
  const seenArmIds = new Set<string>();

  // Build a map of active terminals by armId (multiple terminals can share a arm)
  const activeTerminalsByArm = new Map<string, TerminalView>();
  for (const terminal of columns) {
    const group = activeTerminalsByArm.get(terminal.armId);
    if (group) {
      group.push(terminal);
    } else {
      activeTerminalsByArm.set(terminal.armId, [terminal]);
    }
  }

  // Build arm list: only commandDeck arms (sandbox and other non-commandDeck
  // terminals are excluded from the graph).
  const allArmIds: string[] = [];
  for (const dt of commandDeckArms) {
    allArmIds.push(dt.armId);
    seenArmIds.add(dt.armId);
  }

  const totalArms = allArmIds.length;

  for (let i = 0; i < allArmIds.length; i++) {
    const armId = allArmIds[i];
    if (!armId) continue;
    const armNodeId = buildArmNodeId(armId);
    const prev = prevNodes.get(armNodeId);
    const commandDeck = commandDeckMap.get(armId);
    const activeTerminals = activeTerminalsByArm.get(armId);
    const firstActiveTerminal = activeTerminals?.[0];
    const color = armColor(armId, commandDeck?.color);
    const label = commandDeck?.displayName ?? firstActiveTerminal?.armName ?? armId;

    const angle = (2 * Math.PI * i) / Math.max(totalArms, 1);
    const spread = 300;

    const node: GraphNode = {
      id: armNodeId,
      type: "arm",
      x: prev?.x ?? Math.cos(angle) * spread,
      y: prev?.y ?? Math.sin(angle) * spread,
      vx: prev?.vx ?? 0,
      vy: prev?.vy ?? 0,
      pinned: prev?.pinned ?? false,
      radius: ARM_RADIUS,
      armId,
      label,
      color,
      ...(firstActiveTerminal ? { workspaceMode: firstActiveTerminal.workspaceMode } : {}),
      ...(commandDeck?.octopus ? { octopus: commandDeck.octopus } : {}),
    };
    nodes.push(node);
    currentNodesById.set(armNodeId, node);

    // Active terminal session nodes — one per terminal in this arm
    if (activeTerminals) {
      for (const activeTerminal of activeTerminals) {
        const sessionNodeId = buildActiveSessionNodeId(activeTerminal.terminalId);
        const prevSession = prevNodes.get(sessionNodeId);
        const parentNodeId = activeTerminal.parentTerminalId
          ? buildActiveSessionNodeId(activeTerminal.parentTerminalId)
          : armNodeId;
        const parentNode = currentNodesById.get(parentNodeId) ?? node;
        const jitter = () => (Math.random() - 0.5) * 60;

        const runtimeInfo = agentRuntimeStates?.get(activeTerminal.terminalId);
        const sessionNode: GraphNode = {
          id: sessionNodeId,
          type: "active-session",
          x: prevSession?.x ?? parentNode.x + jitter(),
          y: prevSession?.y ?? parentNode.y + jitter(),
          vx: prevSession?.vx ?? 0,
          vy: prevSession?.vy ?? 0,
          pinned: prevSession?.pinned ?? false,
          radius: ACTIVE_SESSION_RADIUS,
          armId,
          label: activeTerminal.armName || activeTerminal.terminalId,
          color,
          sessionId: activeTerminal.terminalId,
          agentState: activeTerminal.state,
          hasUserPrompt: activeTerminal.hasUserPrompt ?? false,
          ...(activeTerminal.workspaceMode ? { workspaceMode: activeTerminal.workspaceMode } : {}),
          ...(activeTerminal.parentTerminalId
            ? { parentTerminalId: activeTerminal.parentTerminalId }
            : {}),
          ...(runtimeInfo ? { agentRuntimeState: runtimeInfo.state } : {}),
          ...(runtimeInfo?.toolName ? { waitingToolName: runtimeInfo.toolName } : {}),
        };
        nodes.push(sessionNode);
        currentNodesById.set(sessionNodeId, sessionNode);
        edges.push({ source: parentNodeId, target: sessionNodeId });
      }
    }
  }

  // Captain — synthetic always-present node
  const prevCaptain = prevNodes.get(CAPTAIN_NODE_ID);
  const captainColor = getAccentPrimary();
  const captainNode: GraphNode = {
    id: CAPTAIN_NODE_ID,
    type: "captain",
    x: prevCaptain?.x ?? 0,
    y: prevCaptain?.y ?? 0,
    vx: prevCaptain?.vx ?? 0,
    vy: prevCaptain?.vy ?? 0,
    pinned: prevCaptain?.pinned ?? false,
    radius: CAPTAIN_RADIUS,
    armId: CAPTAIN_ID,
    label: "Captain",
    color: captainColor,
  };
  nodes.push(captainNode);
  currentNodesById.set(CAPTAIN_NODE_ID, captainNode);

  // Connect captain to every arm node
  for (const armId of allArmIds) {
    edges.push({ source: CAPTAIN_NODE_ID, target: buildArmNodeId(armId) });
  }

  // Link active terminals belonging to captain
  for (const terminal of columns) {
    if (terminal.armId !== CAPTAIN_ID) continue;
    const sessionNodeId = buildActiveSessionNodeId(terminal.terminalId);
    const prevSession = prevNodes.get(sessionNodeId);
    const jitter = () => (Math.random() - 0.5) * 60;

    const captainRuntimeInfo = agentRuntimeStates?.get(terminal.terminalId);
    const sessionNode: GraphNode = {
      id: sessionNodeId,
      type: "active-session",
      x: prevSession?.x ?? captainNode.x + jitter(),
      y: prevSession?.y ?? captainNode.y + jitter(),
      vx: prevSession?.vx ?? 0,
      vy: prevSession?.vy ?? 0,
      pinned: prevSession?.pinned ?? false,
      radius: ACTIVE_SESSION_RADIUS,
      armId: CAPTAIN_ID,
      label: terminal.armName || terminal.terminalId,
      color: captainColor,
      sessionId: terminal.terminalId,
      agentState: terminal.state,
      hasUserPrompt: terminal.hasUserPrompt ?? false,
      ...(terminal.workspaceMode ? { workspaceMode: terminal.workspaceMode } : {}),
      ...(terminal.parentTerminalId ? { parentTerminalId: terminal.parentTerminalId } : {}),
      ...(captainRuntimeInfo ? { agentRuntimeState: captainRuntimeInfo.state } : {}),
      ...(captainRuntimeInfo?.toolName ? { waitingToolName: captainRuntimeInfo.toolName } : {}),
    };
    nodes.push(sessionNode);
    currentNodesById.set(sessionNodeId, sessionNode);
    edges.push({ source: CAPTAIN_NODE_ID, target: sessionNodeId });
  }

  // Inactive sessions from conversations
  for (const session of inactiveSessions) {
    if (!session.armId || !seenArmIds.has(session.armId)) continue;
    if (activeTerminalIds.has(session.sessionId)) continue;

    const armNodeId = buildArmNodeId(session.armId);
    const sessionNodeId = buildInactiveSessionNodeId(session.sessionId);
    const prevSession = prevNodes.get(sessionNodeId);

    const parentNode = nodes.find((n) => n.id === armNodeId);
    const parentX = parentNode?.x ?? 0;
    const parentY = parentNode?.y ?? 0;
    const color = armColor(session.armId, commandDeckMap.get(session.armId)?.color);
    const jitter = () => (Math.random() - 0.5) * 60;

    const sessionNode: GraphNode = {
      id: sessionNodeId,
      type: "inactive-session",
      x: prevSession?.x ?? parentX + jitter(),
      y: prevSession?.y ?? parentY + jitter(),
      vx: prevSession?.vx ?? 0,
      vy: prevSession?.vy ?? 0,
      pinned: prevSession?.pinned ?? false,
      radius: INACTIVE_SESSION_RADIUS,
      armId: session.armId,
      label: session.firstUserTurnPreview
        ? session.firstUserTurnPreview.slice(0, 40)
        : session.sessionId.slice(0, 12),
      color,
      sessionId: session.sessionId,
      ...(session.firstUserTurnPreview !== null
        ? { firstPromptPreview: session.firstUserTurnPreview }
        : {}),
    };
    nodes.push(sessionNode);
    currentNodesById.set(sessionNodeId, sessionNode);
    edges.push({ source: armNodeId, target: sessionNodeId });
  }

  // Update position cache
  const nextMap = new Map<string, GraphNode>();
  for (const n of nodes) {
    nextMap.set(n.id, n);
  }
  prevNodesRef.current = nextMap;

  return {
    nodes,
    edges,
    armById: commandDeckMap,
    sessionsByArmId,
    refresh,
    refreshCommandDeckArms,
  };
};
