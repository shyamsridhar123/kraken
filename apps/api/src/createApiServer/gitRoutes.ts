import { RuntimeInputError } from "../terminalRuntime";
import {
  parseArmCommitMessage,
  parseArmPullRequestCreateInput,
  parseArmSyncBaseRef,
} from "./gitParsers";
import type { ApiRouteHandler } from "./routeHelpers";
import { readJsonBodyOrWriteError, writeJson, writeMethodNotAllowed } from "./routeHelpers";

const ARM_GIT_ACTION_PATH_PATTERN =
  /^\/api\/arms\/([^/]+)\/git\/(status|commit|push|sync)$/;
const ARM_GIT_PULL_REQUEST_PATH_PATTERN = /^\/api\/arms\/([^/]+)\/git\/pr$/;
const ARM_GIT_PULL_REQUEST_MERGE_PATH_PATTERN = /^\/api\/arms\/([^/]+)\/git\/pr\/merge$/;

export const handleArmGitRoute: ApiRouteHandler = async (
  { request, response, requestUrl, corsOrigin },
  { runtime },
) => {
  const gitMatch = requestUrl.pathname.match(ARM_GIT_ACTION_PATH_PATTERN);
  if (!gitMatch) {
    return false;
  }

  const armId = decodeURIComponent(gitMatch[1] ?? "");
  const action = gitMatch[2];

  try {
    if (action === "status") {
      if (request.method !== "GET") {
        writeMethodNotAllowed(response, corsOrigin);
        return true;
      }

      const payload = runtime.readArmGitStatus(armId);
      if (!payload) {
        writeJson(response, 404, { error: "Arm not found." }, corsOrigin);
        return true;
      }

      writeJson(response, 200, payload, corsOrigin);
      return true;
    }

    if (action === "commit") {
      if (request.method !== "POST") {
        writeMethodNotAllowed(response, corsOrigin);
        return true;
      }

      const bodyReadResult = await readJsonBodyOrWriteError(request, response, corsOrigin);
      if (!bodyReadResult.ok) {
        return true;
      }

      const commitMessageResult = parseArmCommitMessage(bodyReadResult.payload);
      if (commitMessageResult.error || !commitMessageResult.message) {
        writeJson(
          response,
          400,
          { error: commitMessageResult.error ?? "Commit message cannot be empty." },
          corsOrigin,
        );
        return true;
      }

      const payload = runtime.commitArmWorktree(armId, commitMessageResult.message);
      if (!payload) {
        writeJson(response, 404, { error: "Arm not found." }, corsOrigin);
        return true;
      }

      writeJson(response, 200, payload, corsOrigin);
      return true;
    }

    if (action === "push") {
      if (request.method !== "POST") {
        writeMethodNotAllowed(response, corsOrigin);
        return true;
      }

      const payload = runtime.pushArmWorktree(armId);
      if (!payload) {
        writeJson(response, 404, { error: "Arm not found." }, corsOrigin);
        return true;
      }

      writeJson(response, 200, payload, corsOrigin);
      return true;
    }

    if (request.method !== "POST") {
      writeMethodNotAllowed(response, corsOrigin);
      return true;
    }

    const bodyReadResult = await readJsonBodyOrWriteError(request, response, corsOrigin);
    if (!bodyReadResult.ok) {
      return true;
    }

    const baseRefResult = parseArmSyncBaseRef(bodyReadResult.payload);
    if (baseRefResult.error) {
      writeJson(response, 400, { error: baseRefResult.error }, corsOrigin);
      return true;
    }

    const payload = runtime.syncArmWorktree(armId, baseRefResult.baseRef ?? undefined);
    if (!payload) {
      writeJson(response, 404, { error: "Arm not found." }, corsOrigin);
      return true;
    }

    writeJson(response, 200, payload, corsOrigin);
    return true;
  } catch (error) {
    if (error instanceof RuntimeInputError) {
      writeJson(response, 409, { error: error.message }, corsOrigin);
      return true;
    }
    throw error;
  }
};

export const handleArmGitPullRequestRoute: ApiRouteHandler = async (
  { request, response, requestUrl, corsOrigin },
  { runtime },
) => {
  const mergeMatch = requestUrl.pathname.match(ARM_GIT_PULL_REQUEST_MERGE_PATH_PATTERN);
  if (mergeMatch) {
    if (request.method !== "POST") {
      writeMethodNotAllowed(response, corsOrigin);
      return true;
    }

    const armId = decodeURIComponent(mergeMatch[1] ?? "");
    try {
      const payload = runtime.mergeArmPullRequest(armId);
      if (!payload) {
        writeJson(response, 404, { error: "Arm not found." }, corsOrigin);
        return true;
      }

      writeJson(response, 200, payload, corsOrigin);
      return true;
    } catch (error) {
      if (error instanceof RuntimeInputError) {
        writeJson(response, 409, { error: error.message }, corsOrigin);
        return true;
      }
      throw error;
    }
  }

  const prMatch = requestUrl.pathname.match(ARM_GIT_PULL_REQUEST_PATH_PATTERN);
  if (!prMatch) {
    return false;
  }

  const armId = decodeURIComponent(prMatch[1] ?? "");

  try {
    if (request.method === "GET") {
      const payload = runtime.readArmPullRequest(armId);
      if (!payload) {
        writeJson(response, 404, { error: "Arm not found." }, corsOrigin);
        return true;
      }

      writeJson(response, 200, payload, corsOrigin);
      return true;
    }

    if (request.method !== "POST") {
      writeMethodNotAllowed(response, corsOrigin);
      return true;
    }

    const bodyReadResult = await readJsonBodyOrWriteError(request, response, corsOrigin);
    if (!bodyReadResult.ok) {
      return true;
    }

    const pullRequestInput = parseArmPullRequestCreateInput(bodyReadResult.payload);
    if (pullRequestInput.error || !pullRequestInput.title) {
      writeJson(
        response,
        400,
        { error: pullRequestInput.error ?? "Pull request title cannot be empty." },
        corsOrigin,
      );
      return true;
    }

    const payload = runtime.createArmPullRequest(armId, {
      title: pullRequestInput.title,
      ...(pullRequestInput.body.length > 0 ? { body: pullRequestInput.body } : {}),
      ...(pullRequestInput.baseRef !== null ? { baseRef: pullRequestInput.baseRef } : {}),
    });
    if (!payload) {
      writeJson(response, 404, { error: "Arm not found." }, corsOrigin);
      return true;
    }

    writeJson(response, 200, payload, corsOrigin);
    return true;
  } catch (error) {
    if (error instanceof RuntimeInputError) {
      writeJson(response, 409, { error: error.message }, corsOrigin);
      return true;
    }
    throw error;
  }
};
