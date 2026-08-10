import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveConvexDeploymentUrl } from "@/lib/convex/deploymentUrl";

describe("Convex deployment URL boundary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("prefers the Convex URL frozen into the Vercel build", () => {
    expect(
      resolveConvexDeploymentUrl("https://managed-preview.convex.cloud"),
    ).toBe("https://managed-preview.convex.cloud");
  });

  it("fails closed instead of falling back to a stale runtime URL", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CONVEX_URL",
      "https://stale-runtime.convex.cloud",
    );
    vi.stubEnv("CONVEX_DEPLOYMENT_URL", "");

    expect(() => resolveConvexDeploymentUrl()).toThrow(
      "CONVEX_NOT_CONFIGURED",
    );
  });

  it("keeps the build constant as a direct process.env access for Next", () => {
    const source = readFileSync(
      resolve("src/lib/convex/deploymentUrl.ts"),
      "utf8",
    );

    expect(source).toContain("process.env.CONVEX_DEPLOYMENT_URL");
  });

  it("maps Convex's injected public URL to the server build constant", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CONVEX_URL",
      "https://managed-preview.convex.cloud",
    );

    const config = (await import("../../next.config")).default;

    expect(config.env?.CONVEX_DEPLOYMENT_URL).toBe(
      "https://managed-preview.convex.cloud",
    );
  });
});
