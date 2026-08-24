#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const config = join(root, ".agents", "mcp_config.json");
const inspector = join(root, "node_modules", "@modelcontextprotocol", "inspector", "clients", "launcher", "build", "index.js");
const failures = [];
const warnings = [];
const checks = {};

function invoke(server, method, extra = [], expectSuccess = true) {
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, [
    inspector,
    "--cli",
    "--config", config,
    "--server", server,
    "--method", method,
    ...extra,
    "--format", "json",
  ], {
    cwd: root,
    encoding: "utf8",
    timeout: 90_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const candidates = [result.stdout.trim(), ...result.stderr.split(/\r?\n/).map((line) => line.trim())].filter(Boolean);
  let payload;
  for (const candidate of candidates) {
    try {
      payload = JSON.parse(candidate);
      break;
    } catch {
      // Server diagnostics may share stderr with Inspector's single JSON result.
    }
  }
  if (!payload) throw new Error(`${server} ${method} returned non-JSON output: ${result.stdout || result.stderr}`);
  if (expectSuccess && result.status !== 0) throw new Error(`${server} ${method} failed: ${result.stderr || result.stdout}`);
  if (!expectSuccess && result.status === 0) throw new Error(`${server} ${method} unexpectedly succeeded`);
  if (/Assertion failed:.*UV_HANDLE_CLOSING/i.test(result.stderr)) {
    warnings.push(`${server} emitted a Windows libuv teardown assertion after returning valid MCP JSON`);
  }
  return { payload, status: result.status, duration_ms: Date.now() - startedAt };
}

function toolNames(call) {
  return call.payload.result?.tools?.map((tool) => tool.name) ?? [];
}

if (!existsSync(config)) failures.push(".agents/mcp_config.json is missing");
if (!existsSync(inspector)) failures.push("pinned MCP Inspector is not installed");

if (failures.length === 0) {
  try {
    const graphTools = invoke("graphify", "tools/list");
    const graphNames = toolNames(graphTools);
    const requiredGraphTools = ["query_graph", "get_node", "get_neighbors", "graph_stats", "shortest_path", "list_prs", "get_pr_impact"];
    const graphSchemasValid = graphTools.payload.result.tools.every((tool) => tool.inputSchema?.type === "object");
    const forbidden = /(?:deploy|promote|delete|write|mutate|publish|send|rotate|secret)/i;
    const productionMutationTools = graphNames.filter((name) => forbidden.test(name));
    checks.graphify_inventory = {
      status: requiredGraphTools.every((name) => graphNames.includes(name)) && graphSchemasValid && productionMutationTools.length === 0 ? "PASS" : "FAIL",
      tools: graphNames,
      valid_input_schemas: graphSchemasValid,
      production_mutation_tools: productionMutationTools,
      duration_ms: graphTools.duration_ms,
    };
    if (checks.graphify_inventory.status !== "PASS") failures.push("Graphify MCP inventory or schema boundary failed");

    const graphCall = invoke("graphify", "tools/call", ["--tool-name", "graph_stats", "--tool-args-json", "{}"]);
    const stats = graphCall.payload.result?.content?.find((item) => item.type === "text")?.text ?? "";
    checks.graphify_execution = {
      status: graphCall.payload.result?.isError === false && /Nodes:\s*\d+/.test(stats) && /Edges:\s*\d+/.test(stats) ? "PASS" : "FAIL",
      summary: stats.trim().split(/\r?\n/),
      duration_ms: graphCall.duration_ms,
    };
    if (checks.graphify_execution.status !== "PASS") failures.push("Graphify MCP graph_stats execution failed");

    const contextTools = invoke("context7", "tools/list");
    const contextNames = toolNames(contextTools);
    const contextReadOnly = contextTools.payload.result.tools.every((tool) => tool.annotations?.readOnlyHint === true && tool.annotations?.destructiveHint === false);
    checks.context7_inventory = {
      status: ["resolve-library-id", "query-docs"].every((name) => contextNames.includes(name)) && contextReadOnly ? "PASS" : "FAIL",
      tools: contextNames,
      read_only_annotations: contextReadOnly,
      duration_ms: contextTools.duration_ms,
    };
    if (checks.context7_inventory.status !== "PASS") failures.push("Context7 MCP inventory or read-only boundary failed");

    const contextCall = invoke("context7", "tools/call", [
      "--tool-name", "resolve-library-id",
      "--tool-args-json", JSON.stringify({ libraryName: "Next.js", query: "Next.js 16 proxy convention" }),
    ]);
    const contextText = contextCall.payload.result?.content?.find((item) => item.type === "text")?.text ?? "";
    checks.context7_execution = {
      status: /\/vercel\/next\.js/.test(contextText) ? "PASS" : "FAIL",
      resolved_library: "/vercel/next.js",
      duration_ms: contextCall.duration_ms,
    };
    if (checks.context7_execution.status !== "PASS") failures.push("Context7 MCP resolve-library-id execution failed");

    const invalid = invoke("graphify", "tools/call", ["--tool-name", "missing_tool", "--tool-args-json", "{}"], false);
    checks.failure_behavior = {
      status: invalid.payload.error?.code === "tool_not_found" ? "PASS" : "FAIL",
      error_code: invalid.payload.error?.code,
      duration_ms: invalid.duration_ms,
    };
    if (checks.failure_behavior.status !== "PASS") failures.push("MCP unknown-tool failure was not deterministic");
  } catch (error) {
    failures.push(error.message);
  }
}

const report = {
  schema_version: "1.0.0",
  passed: failures.length === 0,
  inspector: { package: "@modelcontextprotocol/inspector", version: "2.2.0", mode: "cli/read-only-config" },
  checks,
  warnings: [...new Set(warnings)],
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
