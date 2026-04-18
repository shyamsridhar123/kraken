export type MonitorUsageSnapshot = {
  status: "ok" | "unavailable" | "error";
  source: "none";
  fetchedAt: string;
  message?: string | null;
};
