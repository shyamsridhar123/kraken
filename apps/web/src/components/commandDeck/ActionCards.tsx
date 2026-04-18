import { Check } from "lucide-react";

import type { TerminalAgentProvider } from "../../app/types";
import { KrakenGlyph } from "../EmptyKraken";

export const AGENT_PROVIDER_OPTIONS: { value: TerminalAgentProvider; label: string }[] = [
  { value: "claude-code", label: "Claude Code" },
  { value: "codex", label: "Codex" },
];

export type ActionCardsProps = {
  compact?: boolean;
  selectedAgent: TerminalAgentProvider;
  setSelectedAgent: (agent: TerminalAgentProvider) => void;
  agentMenuOpen: boolean;
  setAgentMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  agentMenuRef: React.RefObject<HTMLDivElement | null>;
  onAddManually: () => void;
  onLaunchAgent: () => void;
  isLaunchingAgent?: boolean;
};

export const ActionCards = ({
  compact,
  selectedAgent,
  setSelectedAgent,
  agentMenuOpen,
  setAgentMenuOpen,
  agentMenuRef,
  onAddManually,
  onLaunchAgent,
  isLaunchingAgent,
}: ActionCardsProps) => (
  <div className={`commandDeck-empty-actions${compact ? " commandDeck-empty-actions--compact" : ""}`}>
    <button type="button" className="commandDeck-empty-card" onClick={onAddManually}>
      <div className="commandDeck-empty-card-icon">
        <KrakenGlyph
          color="#d4a017"
          animation="idle"
          expression="normal"
          accessory="none"
          scale={compact ? 3 : 4}
        />
      </div>
      <div className="commandDeck-empty-card-text">
        <span className="commandDeck-empty-card-title">Create First Arm</span>
        <span className="commandDeck-empty-card-desc">
          Start the deck by creating a arm for your codebase
        </span>
      </div>
    </button>
    <div className="commandDeck-empty-card">
      <span className="commandDeck-empty-card-icon commandDeck-empty-card-icon--terminal">&gt;_</span>
      <div className="commandDeck-empty-card-text">
        <span className="commandDeck-empty-card-title">Open Agent</span>
        <span className="commandDeck-empty-card-desc">
          Launch your coding agent to create arms based on your codebase
        </span>
        <div className="commandDeck-empty-agent-select-row">
          <div className="commandDeck-empty-agent-picker" ref={agentMenuRef}>
            <button
              type="button"
              className="commandDeck-empty-agent-trigger"
              aria-expanded={agentMenuOpen}
              aria-haspopup="menu"
              onClick={() => setAgentMenuOpen((p: boolean) => !p)}
            >
              {AGENT_PROVIDER_OPTIONS.find((o) => o.value === selectedAgent)?.label}
              <svg className="commandDeck-empty-agent-chevron" viewBox="0 0 10 6" aria-hidden="true">
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {agentMenuOpen && (
              <div className="commandDeck-empty-agent-menu" role="menu">
                {AGENT_PROVIDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="commandDeck-empty-agent-menu-item"
                    role="menuitem"
                    data-active={opt.value === selectedAgent ? "true" : "false"}
                    onClick={() => {
                      setSelectedAgent(opt.value);
                      setAgentMenuOpen(false);
                    }}
                  >
                    {opt.label}
                    {opt.value === selectedAgent && (
                      <span className="commandDeck-empty-agent-menu-check">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="commandDeck-empty-agent-launch"
            disabled={isLaunchingAgent}
            onClick={onLaunchAgent}
          >
            {isLaunchingAgent ? "..." : "Launch"}
          </button>
        </div>
      </div>
    </div>
    <button type="button" className="commandDeck-empty-card" onClick={onAddManually}>
      <span className="commandDeck-empty-card-icon commandDeck-empty-card-icon--terminal">+</span>
      <div className="commandDeck-empty-card-text">
        <span className="commandDeck-empty-card-title">Add Arm Manually</span>
        <span className="commandDeck-empty-card-desc">
          Create a custom arm with your own configuration
        </span>
      </div>
    </button>
  </div>
);
