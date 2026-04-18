/**
 * Monitor types — minimal stub.
 * The X/Twitter monitor is dropped in Kraken; only types are retained
 * for interface compatibility.
 */

export type MonitorConfig = {
  enabled: boolean;
};

export type MonitorEvent = {
  type: string;
  timestamp: string;
  payload?: unknown;
};
