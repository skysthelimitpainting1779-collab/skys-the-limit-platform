#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const rubric = JSON.parse(readFileSync(`${root}/.agents/reuse/candidate-rubric.json`, "utf8"));

const decisions = new Set(["REUSE_EXISTING", "USE_NATIVE", "ADOPT", "ADAPT", "BUILD_CUSTOM", "DEFER", "REJECT"]);
const required = ["research_id", "task", "date", "current_sha", "problem", "required_capabilities", "existing_project_solution", "native_options", "official_ecosystem_options", "oss_candidates", "finalists", "recommended_decision", "research_status", "selected_candidate", "rejected_candidates", "risks", "proof_required_before_adoption", "rollback_or_exit_strategy", "rounds"];

export function validateResearchPacket(packet) {
  const failures = [];
  for (const field of required) if (!(field in packet)) failures.push(`missing ${field}`);
  if (!/^[0-9a-f]{40}$/i.test(packet.current_sha ?? "")) failures.push("current_sha must be exact");
  if (!decisions.has(packet.recommended_decision)) failures.push("invalid decision");
  if (!new Set(["COMPLETE", "RESEARCH_EXHAUSTED"]).has(packet.research_status)) failures.push("invalid research_status");
  const candidates = [...(packet.native_options ?? []), ...(packet.official_ecosystem_options ?? []), ...(packet.oss_candidates ?? [])];
  if (candidates.length > 5) failures.push("shortlist exceeds five candidates");
  if ((packet.finalists ?? []).length > 3) failures.push("finalists exceed three");
  for (const finalist of packet.finalists ?? []) {
    if ("total_score" in finalist || "numeric_score" in finalist) failures.push(`${finalist.name ?? "finalist"} uses a prohibited aggregate score`);
    for (const [section, fields] of Object.entries(rubric.sections)) {
      if (!finalist.assessment?.[section]) { failures.push(`${finalist.name ?? "finalist"} missing ${section}`); continue; }
      for (const field of fields) if (!(field in finalist.assessment[section])) failures.push(`${finalist.name ?? "finalist"} missing ${section}.${field}`);
    }
  }
  if (!(packet.rounds?.length >= 1 && packet.rounds.length <= 3)) failures.push("research must use one to three rounds");
  for (const [index, round] of (packet.rounds ?? []).entries()) {
    if (index > 0 && !String(round.material_gain ?? "").trim()) failures.push(`round ${index + 1} lacks material gain`);
  }
  if (!packet.existing_project_solution || !Array.isArray(packet.existing_project_solution.evidence)) failures.push("existing project evidence missing");
  if (!Array.isArray(packet.rollback_or_exit_strategy) || !packet.rollback_or_exit_strategy.length) failures.push("exit strategy missing");
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = process.argv[2];
  if (!path) { console.error("Usage: validate-packet <research-packet.json>"); process.exit(2); }
  const failures = validateResearchPacket(JSON.parse(readFileSync(path, "utf8")));
  if (failures.length) { console.error(failures.map((failure) => `FAIL ${failure}`).join("\n")); process.exit(1); }
  console.log(`PASS research packet ${path}`);
}
