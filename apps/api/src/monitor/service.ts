import type { MonitorPost } from "./types";

export type MonitorCacheStaleOptions = {
  now: Date;
  maxCacheAgeMs: number;
  lastFetchedAt: string | null;
  cachedQueryTerms: string[];
  currentQueryTerms: string[];
};

export const isMonitorCacheStale = (options: MonitorCacheStaleOptions): boolean => {
  const { now, maxCacheAgeMs, lastFetchedAt, cachedQueryTerms, currentQueryTerms } = options;

  if (!lastFetchedAt) {
    return true;
  }

  if (JSON.stringify(cachedQueryTerms) !== JSON.stringify(currentQueryTerms)) {
    return true;
  }

  const lastFetched = new Date(lastFetchedAt).getTime();
  const age = now.getTime() - lastFetched;

  return age > maxCacheAgeMs;
};

export const rankAndLimitPostsByLikes = (posts: MonitorPost[], limit: number): MonitorPost[] => {
  const seenIds = new Map<string, MonitorPost>();

  for (const post of posts) {
    if (!seenIds.has(post.id) || (seenIds.get(post.id)?.likeCount ?? 0) < post.likeCount) {
      seenIds.set(post.id, post);
    }
  }

  const unique = Array.from(seenIds.values());
  unique.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));

  return unique.slice(0, limit);
};
