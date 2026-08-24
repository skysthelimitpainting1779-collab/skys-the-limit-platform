#!/usr/bin/env node
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { transitionCircuit } from "./circuit-state.mjs";

const args = process.argv.slice(2);
const option = (name, fallback = "") => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const ledgerPath = resolve(option("--ledger", ".agents/runtime/CIRCUIT_STATE.json"));
const agent = option("--agent").toUpperCase();
const actor = option("--actor", agent).toUpperCase();
const eventPath = option("--event");
if (!agent || !eventPath) {
  console.error("Usage: circuit-cli --agent A4 --actor A0 --event event.json [--ledger path]");
  process.exit(2);
}
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
const event = JSON.parse(readFileSync(resolve(eventPath), "utf8"));
const result = transitionCircuit(ledger, agent, event, actor);
if (result.ledger && (result.allowed || result.transition === "OPEN")) {
  const temporary = `${ledgerPath}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(result.ledger, null, 2)}\n`);
  renameSync(temporary, ledgerPath);
}
console.log(JSON.stringify({ allowed: result.allowed, code: result.code, transition: result.transition, reason: result.reason }, null, 2));
if (!result.allowed && result.transition !== "OPEN") process.exitCode = 1;
