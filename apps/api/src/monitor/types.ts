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

export type MonitorPost = {
  source: string;
  id: string;
  text: string;
  author: string;
  createdAt: string;
  likeCount: number;
  permalink: string;
  matchedQueryTerm: string | null;
};
