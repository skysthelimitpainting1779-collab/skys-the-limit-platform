import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = resolve(".github/workflows/lead-intake-e2e.yml");
const bootstrapPath = resolve("convex/ci.ts");

describe("lead-intake CI isolation contract", () => {
  it("configures every fail-closed WorkOS input on the local Convex deployment", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const deploymentVariables = [
      "WORKOS_CLIENT_ID",
      "WORKOS_API_KEY",
      "WORKOS_WEBHOOK_SECRET",
      "WORKOS_ACTION_SECRET",
    ];

    for (const variable of deploymentVariables) {
      expect(workflow).toMatch(new RegExp(`^\\s{6}${variable}:`, "m"));
      expect(workflow).toContain(
        `npx convex env set ${variable} "$${variable}"`,
      );
    }

    const initIndex = workflow.indexOf(
      "CONVEX_AGENT_MODE=anonymous npx convex init",
    );
    const firstEnvironmentWriteIndex = workflow.indexOf("npx convex env set");
    const devIndex = workflow.indexOf(
      "CONVEX_AGENT_MODE=anonymous npx convex dev",
    );

    expect(initIndex).toBeGreaterThanOrEqual(0);
    expect(firstEnvironmentWriteIndex).toBeGreaterThan(initIndex);
    expect(devIndex).toBeGreaterThan(firstEnvironmentWriteIndex);
  });

  it("provides complete local AuthKit inputs without deployment credentials", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    for (const variable of [
      "WORKOS_COOKIE_PASSWORD",
      "WORKOS_REDIRECT_URI",
      "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
    ]) {
      expect(workflow).toMatch(new RegExp(`^\\s{6}${variable}:`, "m"));
    }
    expect(workflow).toContain('ENABLE_EXTERNAL_EFFECTS: "false"');
  });

  it("bootstraps a real tenant ID through an internal-only Convex mutation", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const bootstrap = readFileSync(bootstrapPath, "utf8");

    expect(bootstrap).toContain("internalMutation");
    expect(bootstrap).not.toMatch(/export const .* = mutation\(/);
    expect(workflow).toContain("npx convex run ci:ensureLocalTestOrganization");
    expect(workflow).toContain("NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=$test_org_id");
  });
});
