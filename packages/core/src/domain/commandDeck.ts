export type ArmStatus = "idle" | "active" | "blocked" | "needs-review";

export type KrakenAppearance = {
  animation: string | null;
  expression: string | null;
  accessory: string | null;
  hairColor: string | null;
};

export type CommandDeckAvailableSkill = {
  name: string;
  description: string;
  source: "project" | "user";
};

export type ArmSummary = {
  armId: string;
  displayName: string;
  description: string;
  status: ArmStatus;
  color: string | null;
  kraken: KrakenAppearance;
  scope: {
    paths: string[];
    tags: string[];
  };
  vaultFiles: string[];
  todoTotal: number;
  todoDone: number;
  todoItems: { text: string; done: boolean }[];
  suggestedSkills: string[];
};
