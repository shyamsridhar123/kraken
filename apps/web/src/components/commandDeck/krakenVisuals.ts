import type { CommandDeckArmSummary } from "@kraken/core";
import type { KrakenAccessory, KrakenAnimation, KrakenExpression } from "../EmptyKraken";

// ─── Octopus visual derivation (seeded from arm id) ────────────────────

export const KRAKEN_COLORS = [
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

export const ANIMATIONS: KrakenAnimation[] = ["sway", "walk", "jog", "bounce", "float", "swim-up"];
export const EXPRESSIONS: KrakenExpression[] = ["normal", "happy", "angry", "surprised"];
export const ACCESSORIES: KrakenAccessory[] = [
  "none",
  "none",
  "long",
  "mohawk",
  "side-sweep",
  "curly",
];

export function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type KrakenVisuals = {
  color: string;
  animation: KrakenAnimation;
  expression: KrakenExpression;
  accessory: KrakenAccessory;
  hairColor?: string | undefined;
};

export function deriveKrakenVisuals(arm: CommandDeckArmSummary): KrakenVisuals {
  const rng = seededRandom(hashString(arm.armId));
  const stored = arm.octopus;
  return {
    color:
      arm.color ??
      (KRAKEN_COLORS[hashString(arm.armId) % KRAKEN_COLORS.length] as string),
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
