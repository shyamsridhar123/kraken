import type { TerminalSnapshot } from "../domain/terminal.js";

export interface TerminalSnapshotReader {
  listTerminalSnapshots(): Promise<TerminalSnapshot[]>;
}
