import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeFiles = [
  "src/app/residential/page.tsx",
  "src/app/commercial/page.tsx",
  "src/app/public-sector/page.tsx",
  "src/app/customer/page.tsx",
  "src/app/crew/page.tsx",
  "src/app/operations/page.tsx",
];

const unsupportedClaims = [
  "prevailing wage certified",
  "certified payroll",
  "osha 30",
  "background-checked",
  "bonding capacity",
  "zero-voc",
  "low-voc",
  "factory-grade",
  "fully compliant",
  "scalable workforce",
  "night and weekend shifts",
  "secure online payment processing",
  "pay deposits",
];

describe("public content integrity", () => {
  it.each(routeFiles)("keeps %s free of unsupported operational claims", (file) => {
    const content = readFileSync(file, "utf8").toLowerCase();
    for (const claim of unsupportedClaims) {
      expect(content, `${file} contains unsupported claim: ${claim}`).not.toContain(claim);
    }
  });

  it.each(routeFiles)("uses semantic design tokens in %s", (file) => {
    const content = readFileSync(file, "utf8");
    expect(content).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(content).not.toMatch(/(?:bg|text|border)-(?:slate|gray|zinc)-\d+/);
  });
});
