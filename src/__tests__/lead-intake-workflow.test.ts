import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = resolve(".github/workflows/lead-intake-e2e.yml");
const bootstrapPath = resolve("convex/ci.ts");
const vercelConfigPath = resolve("vercel.json");

describe("lead-intake CI isolation contract", () => {
  it("configures every fail-closed server input on the local Convex deployment", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const deploymentVariables = [
      "WORKOS_CLIENT_ID",
      "WORKOS_API_KEY",
      "WORKOS_WEBHOOK_SECRET",
      "WORKOS_ACTION_SECRET",
      "WORKOS_ORGANIZATION_ID",
      "LEAD_INTAKE_SECRET",
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
      "WORKOS_ORGANIZATION_ID",
    ]) {
      expect(workflow).toMatch(new RegExp(`^\\s{6}${variable}:`, "m"));
    }
    expect(workflow).toContain('ENABLE_EXTERNAL_EFFECTS: "false"');
  });

  it("bootstraps the local tenant by stable WorkOS organization ID", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const bootstrap = readFileSync(bootstrapPath, "utf8");

    expect(bootstrap).toContain("internalMutation");
    expect(bootstrap).not.toMatch(/export const .* = mutation\(/);
    expect(workflow).toContain("npx convex run ci:ensureLocalTestOrganization");
    expect(workflow).not.toContain("NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID");
    expect(bootstrap).toContain("WORKOS_ORGANIZATION_ID");
  });

  it("lets Vercel deploy and seed each branch-specific Convex Preview", () => {
    const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
      buildCommand: string;
    };

    expect(vercelConfig.buildCommand).toContain("npx convex deploy");
    expect(vercelConfig.buildCommand).toContain("--cmd 'npm run build'");
    expect(vercelConfig.buildCommand).toContain(
      "--preview-run 'ci:ensurePreviewOrganization'",
    );
    expect(vercelConfig.buildCommand).toContain(
      'if [ "$VERCEL_ENV" = "preview" ]',
    );
    expect(vercelConfig.buildCommand).toContain("else npm run build; fi");
  });
});
