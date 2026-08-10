import { afterEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import {
  CONVEX_PREVIEW_ENVIRONMENT_VARIABLES,
  syncConvexPreviewEnvironment,
} from "../../scripts/sync-convex-preview-env.mjs";

const previewEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "dev",
  CONVEX_DEPLOY_KEY: "preview:key",
  LEAD_INTAKE_SECRET: "lead-intake-secret-with-at-least-32-characters",
  WORKOS_CLIENT_ID: "client_preview",
  WORKOS_API_KEY: "sk_test_preview",
  WORKOS_WEBHOOK_SECRET: "whsec_preview",
  WORKOS_ORGANIZATION_ID: "org_preview",
};

describe("Vercel-managed Convex Preview environment sync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes values only over stdin to the selected branch Preview", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const calls: Array<{
      args: string[];
      input: string;
    }> = [];
    const run = vi.fn(
      (_executable: string, args: string[], options: { input: string }) => {
        calls.push({ args, input: options.input });
        return { status: 0 };
      },
    );

    syncConvexPreviewEnvironment({
      environment: previewEnvironment,
      run: run as unknown as typeof spawnSync,
    });

    expect(calls).toHaveLength(CONVEX_PREVIEW_ENVIRONMENT_VARIABLES.length);
    for (const [index, name] of
      CONVEX_PREVIEW_ENVIRONMENT_VARIABLES.entries()) {
      const call = calls[index];
      expect(call.args).toEqual([
        "convex",
        "env",
        "set",
        name,
        "--preview-name",
        "dev",
      ]);
      expect(call.args).not.toContain(previewEnvironment[name]);
      expect(call.input).toBe(previewEnvironment[name]);
    }
  });

  it("refuses Production and incomplete Preview environments", () => {
    const run = vi.fn();

    expect(() =>
      syncConvexPreviewEnvironment({
        environment: { ...previewEnvironment, VERCEL_ENV: "production" },
        run: run as unknown as typeof spawnSync,
      }),
    ).toThrow("restricted to Vercel Preview");

    expect(() =>
      syncConvexPreviewEnvironment({
        environment: { ...previewEnvironment, LEAD_INTAKE_SECRET: "" },
        run: run as unknown as typeof spawnSync,
      }),
    ).toThrow("LEAD_INTAKE_SECRET is required");
    expect(run).not.toHaveBeenCalled();
  });
});
