#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function validateGraphData(graph, size) {
  const failures = [];
  if (size > 25 * 1024 * 1024) failures.push("canonical graph exceeds the 25MB generated-data ceiling");
  if (!Array.isArray(graph.nodes) || graph.nodes.length < 100) failures.push("canonical graph has too few nodes");
  if (!Array.isArray(graph.links) || graph.links.length < 100) failures.push("canonical graph has too few links");
  if (!/^[0-9a-f]{40}$/i.test(graph.built_at_commit ?? "")) failures.push("canonical graph lacks an exact built_at_commit");
  const ids = new Set((graph.nodes ?? []).map((node) => node.id));
  for (const link of graph.links ?? []) {
    const source = typeof link.source === "object" ? link.source.id : link.source;
    const target = typeof link.target === "object" ? link.target.id : link.target;
    if (!ids.has(source) || !ids.has(target)) { failures.push("canonical graph contains a dangling link"); break; }
  }
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = resolve(process.argv[2] ?? "graphify-out/graph.json");
  const source = readFileSync(path, "utf8");
  const failures = validateGraphData(JSON.parse(source), statSync(path).size);
  if (failures.length) { console.error(failures.map((failure) => `FAIL ${failure}`).join("\n")); process.exit(1); }
  console.log(`PASS canonical Graphify graph ${path}`);
}
