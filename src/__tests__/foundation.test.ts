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

  it("proves asset provenance is truthful without fabricated files", () => {
    const output = execFileSync("node", ["scripts/validate-assets.mjs"], {
      encoding: "utf8",
    });
    const manifest = JSON.parse(
      readFileSync("public/assets-manifest.json", "utf8"),
    ) as {
      assets: unknown[];
      pendingSources: Array<{ driveFileId: string; status: string }>;
    };

    expect(output).toContain("assets: ok");
    expect(manifest.assets).toEqual([]);
    expect(manifest.pendingSources[0].driveFileId).toBe(
      "1Yf3_PhRPO8uv1WuRdkPGUrIK9VAhu6IG",
    );
    expect(manifest.pendingSources[0].status).toBe("awaiting-binary-import");
    expect(manifest.pendingSources[0].driveFileId).not.toMatch(/^(PENDING|DRIVE-)/);
  });
});
