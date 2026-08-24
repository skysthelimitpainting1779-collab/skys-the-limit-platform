import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

export function assertion(actual, expected, label) {
  if (typeof expected === "number") return Object.is(actual, expected) ? null : `${label}: expected ${expected}, received ${actual}`;
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return `${label}: expected an array`;
    const missing = expected.filter((item) => !actual.includes(item));
    return missing.length ? `${label}: missing ${missing.join(", ")}` : null;
  }
  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object") return `${label}: expected an object`;
    for (const [key, value] of Object.entries(expected)) {
      const failure = assertion(actual[key], value, `${label}.${key}`);
      if (failure) return failure;
    }
    return null;
  }
  return actual === expected ? null : `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`;
}

export function gradeCases(cases, results) {
  const byCase = new Map(results.map((result) => [result.case_id, result]));
  const details = [];
  for (const item of cases) {
    const result = byCase.get(item.id);
    const failures = [];
    if (!result) failures.push("missing result");
    else {
      const failure = assertion(result.output, item.expected, "output");
      if (failure) failures.push(failure);
      if (result.judge && (typeof result.judge.score !== "number" || !String(result.judge.reason ?? "").trim())) failures.push("judge output requires numeric score and non-empty reason");
      if (result.candidate_sha && !/^[0-9a-f]{40}$/i.test(result.candidate_sha)) failures.push("candidate_sha must be 40 hex characters");
    }
    details.push({ case_id: item.id, subject: item.subject, passed: failures.length === 0, failures });
  }
  const passed = details.filter((item) => item.passed).length;
  return { passed, total: details.length, rate: details.length ? passed / details.length : 0, details };
}

export function metricDeltaOkay(baseline, candidate, maximumDrop = 0) {
  return candidate + maximumDrop >= baseline;
}

export function evaluatePromotion(baseline, candidate) {
  const reasons = [];
  if (baseline.target_rate != null && !(candidate.target_rate > baseline.target_rate)) reasons.push("target case did not improve");
  if (!metricDeltaOkay(baseline.public_rate, candidate.public_rate, 0)) reasons.push("visible regression");
  if (!metricDeltaOkay(baseline.held_out_rate, candidate.held_out_rate, 0)) reasons.push("HELD_OUT_REGRESSION / EVAL_OVERFIT");
  if ((candidate.protected_diff_count ?? 0) !== 0) reasons.push("METRIC_TAMPERING");
  if ((candidate.flake_variance ?? 0) > 0.05) reasons.push("FLAKY_EVAL");
  for (const metric of ["latency_ms", "tool_calls", "tokens"]) {
    if (baseline[metric] > 0 && candidate[metric] > baseline[metric] * 1.1) reasons.push(`${metric} exceeds 10% budget`);
  }
  return { decision: reasons.length ? "REJECT" : "PROMOTE", reasons };
}
