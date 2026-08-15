import { createHash } from "node:crypto";

export const prohibitedPacketKeys = ["parent_conversation", "parent_reasoning", "desired_verdict", "implementation_confidence", "provisional_learning_notes"];
export const sha256 = (text) => createHash("sha256").update(text).digest("hex");

export function validatePacket(packet) {
  const failures = [];
  for (const field of ["task_contract_id", "verifier", "base_commit_sha", "candidate_commit_sha", "diff", "acceptance_criteria", "graphify_evidence", "context7_evidence", "test_evidence"]) if (!packet[field]) failures.push(`missing ${field}`);
  if (!/^V(?:[0-9]|10)$/.test(packet.verifier ?? "")) failures.push("invalid verifier");
  for (const field of ["base_commit_sha", "candidate_commit_sha"]) if (!/^[0-9a-f]{40}$/i.test(packet[field] ?? "")) failures.push(`${field} is not an exact SHA`);
  for (const key of prohibitedPacketKeys) if (key in packet) failures.push(`prohibited context present: ${key}`);
  for (const field of ["diff", "acceptance_criteria", "graphify_evidence", "context7_evidence", "test_evidence"]) {
    const evidence = packet[field];
    if (evidence && sha256(evidence.text ?? "") !== evidence.sha256) failures.push(`${field} hash mismatch`);
  }
  if (packet.prohibited_context_absent !== true) failures.push("prohibited context absence was not asserted");
  return failures;
}
