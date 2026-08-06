import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowsDirectory = resolve(".github/workflows");
const approvedActions: Record<string, string> = {
  "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
  "actions/setup-node": "820762786026740c76f36085b0efc47a31fe5020",
};

describe("GitHub Actions runtime contract", () => {
  it("pins checkout and setup-node to the approved Node 24 releases", () => {
    const references: Array<{
      action: string;
      file: string;
      reference: string;
    }> = [];

    for (const file of readdirSync(workflowsDirectory).filter((name) =>
      /\.ya?ml$/i.test(name),
    )) {
      const workflow = readFileSync(resolve(workflowsDirectory, file), "utf8");
      for (const match of workflow.matchAll(
        /uses:\s*(actions\/(?:checkout|setup-node))@([^\s#]+)/g,
      )) {
        references.push({ action: match[1], file, reference: match[2] });
      }
    }

    expect(references.length).toBeGreaterThan(0);
    for (const { action, file, reference } of references) {
      expect(reference, `${file}: ${action}`).toBe(approvedActions[action]);
    }
  });
});
