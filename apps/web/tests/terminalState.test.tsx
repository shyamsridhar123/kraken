import { describe, expect, it } from "vitest";

import { retainActiveTerminalEntries, retainActiveTerminalIds } from "../src/app/terminalState";

describe("terminalState helpers", () => {
  it("retains active terminal ids and preserves reference when unchanged", () => {
    const currentTerminalIds = ["arm-1", "arm-2"];
    const activeTerminalIds = new Set(["arm-1", "arm-2", "arm-3"]);

    const nextTerminalIds = retainActiveTerminalIds(currentTerminalIds, activeTerminalIds);

    expect(nextTerminalIds).toBe(currentTerminalIds);
  });

  it("filters removed terminal ids", () => {
    const currentTerminalIds = ["arm-1", "arm-2"];
    const activeTerminalIds = new Set(["arm-2"]);

    const nextTerminalIds = retainActiveTerminalIds(currentTerminalIds, activeTerminalIds);

    expect(nextTerminalIds).toEqual(["arm-2"]);
  });

  it("retains active terminal state entries and preserves reference when unchanged", () => {
    const currentState = {
      "arm-1": "idle",
      "arm-2": "processing",
    };
    const activeTerminalIds = new Set(["arm-1", "arm-2"]);

    const nextState = retainActiveTerminalEntries(currentState, activeTerminalIds);

    expect(nextState).toBe(currentState);
  });

  it("filters removed terminal state entries", () => {
    const currentState = {
      "arm-1": "idle",
      "arm-2": "processing",
    };
    const activeTerminalIds = new Set(["arm-2"]);

    const nextState = retainActiveTerminalEntries(currentState, activeTerminalIds);

    expect(nextState).toEqual({
      "arm-2": "processing",
    });
  });
});
