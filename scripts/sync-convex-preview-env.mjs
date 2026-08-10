import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const CONVEX_PREVIEW_ENVIRONMENT_VARIABLES = [
  "LEAD_INTAKE_SECRET",
  "WORKOS_CLIENT_ID",
  "WORKOS_API_KEY",
  "WORKOS_WEBHOOK_SECRET",
  "WORKOS_ORGANIZATION_ID",
];

function requireConfiguredValue(environment, name) {
  const value = environment[name];
  const normalized = value?.trim().toLowerCase() ?? "";
  if (
    !value?.trim() ||
    [
      "replace_me",
      "replace_with_",
      "placeholder",
      "generate_",
      "unconfigured",
    ].some((marker) => normalized.includes(marker))
  ) {
    throw new Error(`${name} is required for Convex Preview synchronization`);
  }
  if (name === "LEAD_INTAKE_SECRET" && value.length < 32) {
    throw new Error("LEAD_INTAKE_SECRET must contain at least 32 characters");
  }
  return value;
}

function requirePreviewBranch(environment) {
  if (environment.VERCEL_ENV !== "preview") {
    throw new Error("Convex environment sync is restricted to Vercel Preview");
  }
  if (!environment.CONVEX_DEPLOY_KEY) {
    throw new Error("CONVEX_DEPLOY_KEY is required for Convex Preview sync");
  }

  const branch = environment.VERCEL_GIT_COMMIT_REF?.trim() ?? "";
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/.test(branch) ||
    branch.includes("..")
  ) {
    throw new Error("VERCEL_GIT_COMMIT_REF is not a valid Preview name");
  }
  return branch;
}

export function syncConvexPreviewEnvironment({
  environment = process.env,
  run = spawnSync,
} = {}) {
  const branch = requirePreviewBranch(environment);
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";

  for (const name of CONVEX_PREVIEW_ENVIRONMENT_VARIABLES) {
    const value = requireConfiguredValue(environment, name);
    const result = run(
      executable,
      ["convex", "env", "set", name, "--preview-name", branch],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: environment,
        input: value,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    if (result.error || result.status !== 0) {
      throw new Error(
        `Convex Preview environment sync failed for ${name} (exit ${result.status ?? "spawn"})`,
      );
    }
  }

  console.log(
    `Synced ${CONVEX_PREVIEW_ENVIRONMENT_VARIABLES.length} Vercel variables to Convex Preview ${branch}.`,
  );
}

const entrypoint = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;
if (entrypoint === import.meta.url) {
  syncConvexPreviewEnvironment();
}
