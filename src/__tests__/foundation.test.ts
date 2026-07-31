import { describe, it, expect } from "vitest";

describe("Foundation Verification Contract", () => {
  it("proves skills validation passes cleanly", async () => {
    const { execSync } = await import("child_process");
    const output = execSync("node scripts/validate-skills.mjs").toString();
    expect(output).toContain("validated successfully");
  });

  it("proves asset manifest integrity", async () => {
    const fs = await import("fs");
    const manifest = JSON.parse(fs.readFileSync("public/assets-manifest.json", "utf-8"));
    expect(manifest.assets.length).toBeGreaterThan(0);
    expect(manifest.assets[0].classification).toBe("public-approved");
  });
});
