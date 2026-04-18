export type { MonitorConfig, MonitorEvent } from "./types";

/**
 * Monitor service types and utilities.
 */

export class MonitorInputError extends Error {}

export type RefreshPolicy = {
  maxCacheAgeMs?: number;
  maxPosts?: number;
  searchWindowDays?: 1 | 3 | 7;
};

export type MonitorConfigPatchInput = {
  providerId?: string;
  queryTerms?: string[];
  refreshPolicy?: RefreshPolicy;
  credentials?: Record<string, unknown>;
  validateCredentials?: boolean;
};

export type MonitorService = {
  readConfig(): Promise<{ enabled: boolean }>;
  updateConfig(patch: MonitorConfigPatchInput): Promise<void>;
  patchConfig(patch: MonitorConfigPatchInput): Promise<void>;
  readFeed(options?: { forceRefresh?: boolean; refreshIfStale?: boolean }): Promise<{ items: unknown[] }>;
};

export const createMonitorService = (options?: { projectStateDir?: string }): MonitorService => {
  return {
    readConfig: async () => ({
      enabled: false,
    }),
    updateConfig: async () => {
      // No-op
    },
    patchConfig: async () => {
      // No-op
    },
    readFeed: async () => ({
      items: [],
    }),
  };
};
