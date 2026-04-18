import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import type { WorkspaceSetupSnapshot, WorkspaceSetupStep } from "@kraken/core";

import { readDeckArms } from "./deck/readDeckArms";
import {
  deriveProjectIdFromWorkspace,
  ensureKrakenGitignoreEntry,
  ensureProjectScaffold,
  hasKrakenGitignoreEntry,
  loadProjectConfig,
  migrateStateToGlobal,
  registerProject,
} from "./projectPersistence";
import { readSetupState } from "./setupState";
import { collectStartupPrerequisiteReport } from "./startupPrerequisites";

export const initializeWorkspaceFiles = (workspaceCwd: string, projectStateDir: string) => {
  const projectName = loadProjectConfig(workspaceCwd)?.displayName;
  const projectConfig = ensureProjectScaffold(
    workspaceCwd,
    projectName,
    deriveProjectIdFromWorkspace(workspaceCwd),
  );
  registerProject(workspaceCwd, projectConfig.displayName);
  mkdirSync(join(projectStateDir, "state"), { recursive: true });
  migrateStateToGlobal(workspaceCwd, projectStateDir);

  return { projectConfig, projectStateDir };
};

export const ensureWorkspaceGitignore = (workspaceCwd: string) =>
  ensureKrakenGitignoreEntry(workspaceCwd);

export const readWorkspaceSetupSnapshot = (
  workspaceCwd: string,
  projectStateDir: string,
): WorkspaceSetupSnapshot => {
  const prerequisites = collectStartupPrerequisiteReport();
  const projectConfig = loadProjectConfig(workspaceCwd);
  const krakenDir = join(workspaceCwd, ".kraken");
  const hasProjectScaffold =
    projectConfig !== null &&
    existsSync(join(krakenDir, "arms")) &&
    existsSync(join(krakenDir, "worktrees")) &&
    existsSync(join(projectStateDir, "state"));
  const hasGitignore = hasKrakenGitignoreEntry(workspaceCwd);
  const arms = readDeckArms(workspaceCwd, projectStateDir);
  const armCount = arms.length;
  const hasAnyArms = armCount > 0;
  const setupState = readSetupState(projectStateDir);
  const isFirstRun = !hasAnyArms && !setupState.armsInitializedAt;
  const verifiedSteps = setupState.verifiedSteps ?? {};
  const isClaudeVerified = Boolean(verifiedSteps["check-claude"]);
  const isGitVerified = Boolean(verifiedSteps["check-git"]);
  const isCurlVerified = Boolean(verifiedSteps["check-curl"]);
  const hasClaudeCode = prerequisites.availability.claude;
  const hasGit = prerequisites.availability.git;
  const hasCurl = prerequisites.availability.curl;

  const steps: WorkspaceSetupStep[] = [
    {
      id: "initialize-workspace",
      title: "Initialize workspace",
      description: "Create Kraken project files and runtime directories.",
      complete: hasProjectScaffold,
      required: true,
      actionLabel: "Initialize workspace",
      statusText: hasProjectScaffold
        ? "Workspace files are ready."
        : "Create .kraken project files before continuing.",
      guidance: hasProjectScaffold
        ? null
        : "Workspace initialization failed. Run the Kraken initializer in this repository.",
      command: hasProjectScaffold ? null : "kraken init",
    },
    {
      id: "ensure-gitignore",
      title: "Ignore .kraken",
      description: "Add .kraken to .gitignore, or create .gitignore when it is missing.",
      complete: hasGitignore,
      required: true,
      actionLabel: "Update .gitignore",
      statusText: hasGitignore
        ? ".gitignore covers .kraken."
        : "Add .kraken to .gitignore before creating arms.",
      guidance: hasGitignore
        ? null
        : "Git ignore entry is missing. Create or update .gitignore with the Kraken workspace path.",
      command: hasGitignore ? null : "printf '.kraken\\n' >> .gitignore",
    },
    {
      id: "check-claude",
      title: "Check Claude Code",
      description: "Verify the default Claude Code workflow is available on this machine.",
      complete: hasClaudeCode && isClaudeVerified,
      required: false,
      actionLabel: "Check Claude Code",
      statusText: hasClaudeCode
        ? isClaudeVerified
          ? "Claude Code is available."
          : "Confirm Claude Code before using the planner."
        : "Claude Code is unavailable.",
      guidance: hasClaudeCode
        ? isClaudeVerified
          ? null
          : "Click to verify the Claude Code workflow on this machine."
        : "Install Claude Code and log in before using the default Claude workflow.",
      command: hasClaudeCode ? null : "claude login",
    },
    {
      id: "check-git",
      title: "Check Git",
      description: "Verify Git is available for worktree-backed arms.",
      complete: hasGit && isGitVerified,
      required: false,
      actionLabel: "Check Git",
      statusText: hasGit
        ? isGitVerified
          ? "Git is available."
          : "Confirm Git before launching worktree-backed arms."
        : "Git is unavailable.",
      guidance: hasGit
        ? isGitVerified
          ? null
          : "Click to verify Git support for worktree terminal flows."
        : "Install Git to enable worktree terminals and branch flows.",
      command: hasGit ? null : "git --version",
    },
    {
      id: "check-curl",
      title: "Check curl",
      description: "Verify curl is available for Claude hook callbacks.",
      complete: hasCurl && isCurlVerified,
      required: false,
      actionLabel: "Check curl",
      statusText: hasCurl
        ? isCurlVerified
          ? "curl is available."
          : "Confirm curl before using Claude hook callbacks."
        : "curl is unavailable.",
      guidance: hasCurl
        ? isCurlVerified
          ? null
          : "Click to verify hook callback support on this machine."
        : "Install curl to restore Claude hook callbacks.",
      command: hasCurl ? null : "curl --version",
    },
    {
      id: "create-arms",
      title: "Create arms",
      description: "Create at least one arm before launching a coding agent.",
      complete: hasAnyArms,
      required: true,
      actionLabel: null,
      statusText: hasAnyArms
        ? `${armCount} arm${armCount === 1 ? "" : "s"} ready.`
        : "Create your first arm to continue.",
      guidance: hasAnyArms
        ? null
        : "Use the planner or manual creation to add at least one arm.",
      command: null,
    },
  ];

  return {
    isFirstRun,
    shouldShowSetupCard: isFirstRun || (!hasAnyArms && (!hasProjectScaffold || !hasGitignore)),
    hasAnyArms,
    armCount,
    steps,
  };
};
