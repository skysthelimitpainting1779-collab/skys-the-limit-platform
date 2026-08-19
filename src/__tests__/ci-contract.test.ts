import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) =>
  readFileSync(join(root, relativePath), "utf8");

describe("CI workflow integrity contract", () => {
  it("passes the repository workflow contract validator", () => {
    expect(() =>
      execFileSync("node", ["scripts/validate-ci-contract.mjs"], {
        cwd: root,
        stdio: "pipe",
      })
    ).not.toThrow();
  });

  it("runs the contract from CI alongside the existing validation chain", () => {
    const ci = read(".github/workflows/ci.yml");

    expect(ci).toContain("npm run verify:ci-contract");
    expect(ci).toContain("npm run verify:skills");
    expect(ci).toContain("npm run verify:env");
    expect(ci).toContain("npm test");
  });
});
