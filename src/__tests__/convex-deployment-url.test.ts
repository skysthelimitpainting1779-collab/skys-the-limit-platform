import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConvexDeploymentUrl } from "@/lib/convex/deploymentUrl";

describe("Convex deployment URL boundary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("prefers the Convex URL frozen into the Vercel build", () => {
    expect(
      resolveConvexDeploymentUrl({
        CONVEX_DEPLOYMENT_URL: "https://managed-preview.convex.cloud",
        NEXT_PUBLIC_CONVEX_URL: "https://stale-runtime.convex.cloud",
      }),
    ).toBe("https://managed-preview.convex.cloud");
  });

  it("fails closed instead of falling back to a stale runtime URL", () => {
    expect(() =>
      resolveConvexDeploymentUrl({
        NEXT_PUBLIC_CONVEX_URL: "https://stale-runtime.convex.cloud",
      }),
    ).toThrow("CONVEX_NOT_CONFIGURED");
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
