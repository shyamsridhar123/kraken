import type { TerminalSnapshot } from "../domain/terminal.js";
import type { TerminalSnapshotReader } from "../ports/TerminalSnapshotReader.js";

export class InMemoryTerminalSnapshotReader implements TerminalSnapshotReader {
  constructor(private readonly snapshots: TerminalSnapshot[]) {}

  async listTerminalSnapshots(): Promise<TerminalSnapshot[]> {
    return this.snapshots;
  }
}
