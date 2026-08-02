import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("foundation verification contract", () => {
  it("proves skills validation passes cleanly", () => {
    const output = execFileSync("node", ["scripts/validate-skills.mjs"], {
      encoding: "utf8",
    });
    expect(output).toContain("validated successfully");
  });

  it("proves the committed logo has real Drive provenance", () => {
    const output = execFileSync("node", ["scripts/validate-assets.mjs"], {
      encoding: "utf8",
    });
    const manifest = JSON.parse(
      readFileSync("public/assets-manifest.json", "utf8"),
    ) as {
      assets: Array<{ path: string; driveFileId: string; sha256: string }>;
      pendingSources: unknown[];
    };

    expect(output).toContain("assets: ok");
    expect(manifest.assets.length).toBeGreaterThanOrEqual(1);
    expect(manifest.assets[0]).toEqual(
      expect.objectContaining({
        path: "public/brand/logo-illustrated-badge.webp",
        driveFileId: "1Yf3_PhRPO8uv1WuRdkPGUrIK9VAhu6IG",
        sha256: "031ee7ef36b2c773a3806a0ed4ec331276e4c30c81373e378eef6f099f88fbe0",
      }),
    );
    expect(manifest.pendingSources).toEqual([]);
  });
});
