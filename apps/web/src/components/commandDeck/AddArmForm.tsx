import { useEffect, useRef, useState } from "react";

import type { CommandDeckAvailableSkill } from "@kraken/core";
import type { KrakenAccessory, KrakenAnimation, KrakenExpression } from "../EmptyKraken";
import { KrakenGlyph } from "../EmptyKraken";
import { ACCESSORIES, ANIMATIONS, EXPRESSIONS, KRAKEN_COLORS } from "./krakenVisuals";

// ─── Add arm form ───────────────────────────────────────────────────────

export type KrakenAppearancePayload = {
  animation: string;
  expression: string;
  accessory: string;
  hairColor: string;
};

export type AddArmFormProps = {
  onSubmit: (
    name: string,
    description: string,
    color: string,
    octopus: KrakenAppearancePayload,
    suggestedSkills: string[],
  ) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
  availableSkills: CommandDeckAvailableSkill[];
};

export const EXPRESSION_OPTIONS: { value: KrakenExpression; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "happy", label: "Happy" },
  { value: "angry", label: "Angry" },
  { value: "surprised", label: "Surprised" },
];

export const ACCESSORY_OPTIONS: { value: KrakenAccessory; label: string }[] = [
  { value: "none", label: "None" },
  { value: "long", label: "Long" },
  { value: "mohawk", label: "Mohawk" },
  { value: "side-sweep", label: "Side Sweep" },
  { value: "curly", label: "Curly" },
];

export const HAIR_COLORS = [
  "#4a2c0a",
  "#1a1a1a",
  "#c8a04a",
  "#e04020",
  "#f5f5f5",
  "#6b3fa0",
  "#2a6e3f",
  "#1e90ff",
];

export const AddArmForm = ({
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  availableSkills,
}: AddArmFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(
    () => KRAKEN_COLORS[Math.floor(Math.random() * KRAKEN_COLORS.length)] as string,
  );
  const [selectedExpression, setSelectedExpression] = useState<KrakenExpression>(() => {
    const pick = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)] as KrakenExpression;
    return pick;
  });
  const [selectedAccessory, setSelectedAccessory] = useState<KrakenAccessory>(() => {
    const pick = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)] as KrakenAccessory;
    return pick;
  });
  const [selectedAnimation] = useState<KrakenAnimation>(() => {
    const pick = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)] as KrakenAnimation;
    return pick;
  });
  const [selectedHairColor, setSelectedHairColor] = useState(
    () => HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)] as string,
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length === 0) return;
    onSubmit(
      name.trim(),
      description.trim(),
      selectedColor,
      {
        animation: selectedAnimation,
        expression: selectedExpression,
        accessory: selectedAccessory,
        hairColor: selectedHairColor,
      },
      selectedSkills,
    );
  };

  const toggleSkill = (skillName: string) => {
    setSelectedSkills((current) =>
      current.includes(skillName)
        ? current.filter((skill) => skill !== skillName)
        : [...current, skillName].sort((a, b) => a.localeCompare(b)),
    );
  };

  return (
    <form className="commandDeck-add-form" onSubmit={handleSubmit}>
      <div className="commandDeck-add-form-header">
        <button type="button" className="commandDeck-add-form-back" onClick={onCancel}>
          ← Back
        </button>
        <span className="commandDeck-add-form-title">New Arm</span>
      </div>

      <div className="commandDeck-add-form-body">
        <div className="commandDeck-add-form-preview">
          <KrakenGlyph
            color={selectedColor}
            animation={selectedAnimation}
            expression={selectedExpression}
            accessory={selectedAccessory}
            hairColor={selectedHairColor}
            scale={8}
          />
        </div>

        <label className="commandDeck-add-form-label">
          Name
          <input
            ref={nameRef}
            type="text"
            className="commandDeck-add-form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Database Layer"
          />
        </label>

        <label className="commandDeck-add-form-label">
          Description
          <textarea
            className="commandDeck-add-form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this arm is responsible for..."
            rows={3}
          />
        </label>

        {availableSkills.length > 0 && (
          <div className="commandDeck-add-form-label">
            Suggested Skills
            <div className="commandDeck-add-form-skills">
              {availableSkills.map((skill) => {
                const checked = selectedSkills.includes(skill.name);
                return (
                  <label
                    key={`${skill.source}:${skill.name}`}
                    className="commandDeck-add-form-skill-option"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSkill(skill.name)}
                    />
                    <span className="commandDeck-add-form-skill-copy">
                      <span className="commandDeck-add-form-skill-name">{skill.name}</span>
                      {skill.description && (
                        <span className="commandDeck-add-form-skill-desc">{skill.description}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="commandDeck-add-form-label">
          Color
          <div className="commandDeck-add-form-colors">
            {KRAKEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="commandDeck-add-form-color-swatch"
                data-selected={c === selectedColor ? "true" : "false"}
                style={{ backgroundColor: c }}
                onClick={() => setSelectedColor(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="commandDeck-add-form-row">
          <div className="commandDeck-add-form-label">
            Expression
            <div className="commandDeck-add-form-chips">
              {EXPRESSION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="commandDeck-add-form-chip"
                  data-selected={opt.value === selectedExpression ? "true" : "false"}
                  onClick={() => setSelectedExpression(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="commandDeck-add-form-label">
            Hair Style
            <div className="commandDeck-add-form-chips">
              {ACCESSORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="commandDeck-add-form-chip"
                  data-selected={opt.value === selectedAccessory ? "true" : "false"}
                  onClick={() => setSelectedAccessory(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="commandDeck-add-form-label">
            Hair Color
            <div className="commandDeck-add-form-colors">
              {HAIR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="commandDeck-add-form-color-swatch commandDeck-add-form-color-swatch--small"
                  data-selected={c === selectedHairColor ? "true" : "false"}
                  style={{ backgroundColor: c }}
                  onClick={() => setSelectedHairColor(c)}
                  aria-label={`Select hair color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {error && <div className="commandDeck-add-form-error">{error}</div>}

        <button
          type="submit"
          className="commandDeck-add-form-submit"
          disabled={isSubmitting || name.trim().length === 0}
        >
          {isSubmitting ? "Creating..." : "Create Arm"}
        </button>
      </div>
    </form>
  );
};
