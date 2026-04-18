import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_START_PORT = 8787;
const MAX_PORT_ATTEMPTS = 200;

const parseStartPort = (value) => {
  if (!value) {
    return DEFAULT_START_PORT;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return DEFAULT_START_PORT;
  }

  return parsed;
};

const isPortInUseError = (error) =>
  Boolean(error) &&
  typeof error === "object" &&
  "code" in error &&
  (error.code === "EADDRINUSE" || error.code === "EACCES");

const canListenOnPort = (port) =>
  new Promise((resolve) => {
    const probeServer = createServer();

    const closeAndResolve = (result) => {
      probeServer.removeAllListeners();
      probeServer.close(() => {
        resolve(result);
      });
    };

    probeServer.once("error", (error) => {
      if (isPortInUseError(error)) {
        resolve(false);
        return;
      }

      resolve(false);
    });

    probeServer.once("listening", () => {
      closeAndResolve(true);
    });

    probeServer.listen(port, "127.0.0.1");
  });

const findOpenPort = async (startPort) => {
  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = startPort + offset;
    if (port > 65535) {
      break;
    }

    const isAvailable = await canListenOnPort(port);
    if (isAvailable) {
      return port;
    }
  }

  throw new Error(`Unable to find an open port starting from ${startPort}`);
};

const startPort = parseStartPort(process.env.KRAKEN_DEV_START_PORT);
const apiPort = await findOpenPort(startPort);
const apiOrigin = `http://127.0.0.1:${apiPort}`;

console.log(`[kraken-dev] API: ${apiOrigin}`);

const monorepoRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "").replace(/^\/([A-Z]):/, "$1:");

const resolveProjectStateDir = (workspaceCwd) => {
  if (process.env.KRAKEN_PROJECT_STATE_DIR) {
    return process.env.KRAKEN_PROJECT_STATE_DIR;
  }
  const projectConfigPath = join(workspaceCwd, ".kraken", "project.json");
  if (existsSync(projectConfigPath)) {
    try {
      const projectConfig = JSON.parse(readFileSync(projectConfigPath, "utf-8"));
      if (
        typeof projectConfig.projectId === "string" &&
        projectConfig.projectId.trim().length > 0
      ) {
        return join(homedir(), ".kraken", "projects", projectConfig.projectId);
      }
    } catch {
      // fall through
    }
  }
  return `${workspaceCwd}/.kraken`;
};

const workspaceCwd = process.env.KRAKEN_WORKSPACE_CWD ?? monorepoRoot;
const projectStateDir = resolveProjectStateDir(workspaceCwd);

const env = {
  ...process.env,
  KRAKEN_API_PORT: String(apiPort),
  KRAKEN_API_ORIGIN: apiOrigin,
  KRAKEN_WORKSPACE_CWD: workspaceCwd,
  KRAKEN_PROJECT_STATE_DIR: projectStateDir,
  KRAKEN_PROMPTS_DIR: process.env.KRAKEN_PROMPTS_DIR ?? `${monorepoRoot}/prompts`,
  PORT: String(apiPort),
};

// Start API server
const api = spawn("npx", ["tsx", "apps/api/src/server.ts"], {
  stdio: "inherit",
  cwd: monorepoRoot,
  env,
  shell: true,
});

// Start Vite dev server
const web = spawn("npx", ["vite", "--port", "5173"], {
  stdio: "inherit",
  cwd: join(monorepoRoot, "apps", "web"),
  env,
  shell: true,
});

console.log(`[kraken-dev] Web: http://localhost:5173`);

const shutdown = (signal) => {
  if (!api.killed) api.kill(signal);
  if (!web.killed) web.kill(signal);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

api.on("exit", (code) => {
  console.log(`[kraken-dev] API exited (code ${code})`);
  if (!web.killed) web.kill();
  process.exit(code ?? 1);
});

web.on("exit", (code) => {
  console.log(`[kraken-dev] Web exited (code ${code})`);
  if (!api.killed) api.kill();
  process.exit(code ?? 1);
});
