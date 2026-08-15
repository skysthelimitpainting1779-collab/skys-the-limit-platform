const immediateReasons = new Map([
  ["SCOPE_VIOLATION", "SCOPE_VIOLATION"],
  ["SECRET_EXPOSURE", "SECRET_EXPOSURE"],
  ["PRODUCTION_BOUNDARY", "PRODUCTION_BOUNDARY"],
  ["CRITICAL_SECURITY", "CRITICAL_SECURITY"],
  ["HELD_OUT_REGRESSION", "HELD_OUT_REGRESSION"],
  ["METRIC_TAMPERING", "METRIC_TAMPERING"],
  ["FALSE_PASS_REGRESSION", "FALSE_PASS_REGRESSION"],
  ["FLAKY_EVAL", "FLAKY_EVAL"],
]);

const defaults = {
  state: "CLOSED", failure_fingerprint: null, implementation_cycles: 0,
  remediation_cycles: 0, verifier_rejections: 0, consecutive_failures: 0,
  no_progress_events: 0, service_failures: 0, half_open_trials: 0,
  last_hypothesis: null, open_reason: null, half_open_evidence: null,
};

const closeState = () => ({ ...defaults });

function open(entry, reason) {
  entry.state = "OPEN";
  entry.open_reason = reason;
  return { allowed: false, code: reason, transition: "OPEN" };
}

export function transitionCircuit(ledger, agent, event, actor = agent) {
  if (!ledger?.active_circuits?.[agent]) return { allowed: false, code: "UNKNOWN_CIRCUIT", reason: `${agent} has no circuit`, ledger };
  const next = structuredClone(ledger);
  const existing = { ...next.active_circuits[agent] };
  const entry = Object.assign(next.active_circuits[agent], defaults, existing);
  const type = String(event?.type ?? "").toUpperCase();
  let result = { allowed: true, code: "RECORDED", transition: entry.state };

  if (entry.state === "OPEN" && type !== "HALF_OPEN_AUTHORIZE") return { allowed: false, code: "CIRCUIT_OPEN", reason: `${agent} is OPEN`, ledger: next };
  if (type === "HALF_OPEN_AUTHORIZE") {
    if (actor !== "A0") return { allowed: false, code: "A0_REQUIRED", reason: "Only A0 may authorize HALF_OPEN", ledger: next };
    if (entry.state !== "OPEN") return { allowed: false, code: "NOT_OPEN", reason: `${agent} is not OPEN`, ledger: next };
    if (entry.half_open_trials >= 1) return { allowed: false, code: "HALF_OPEN_EXHAUSTED", reason: "The single HALF_OPEN probe is exhausted", ledger: next };
    if (!String(event.material_new_evidence ?? "").trim()) return { allowed: false, code: "NEW_EVIDENCE_REQUIRED", reason: "HALF_OPEN requires materially new evidence", ledger: next };
    entry.state = "HALF_OPEN";
    entry.half_open_trials += 1;
    entry.half_open_evidence = String(event.material_new_evidence);
    return { allowed: true, code: "HALF_OPEN", transition: "HALF_OPEN", ledger: next };
  }

  if (immediateReasons.has(type)) result = open(entry, immediateReasons.get(type));
  else if (type === "IMPLEMENTATION") {
    if (!event.material_change) return { allowed: false, code: "UNCHANGED_RETRY", reason: "Implementation retry requires a material change", ledger: next };
    if (entry.implementation_cycles >= 3) result = open(entry, "IMPLEMENTATION_BUDGET_EXHAUSTED");
    else entry.implementation_cycles += 1;
  } else if (type === "REMEDIATION") {
    const hypothesis = String(event.hypothesis ?? "").trim();
    if (!event.material_change || !hypothesis || hypothesis === entry.last_hypothesis) return { allowed: false, code: "UNCHANGED_RETRY", reason: "Remediation requires a distinct hypothesis and material change", ledger: next };
    if (entry.remediation_cycles >= 3) result = open(entry, "REMEDIATION_BUDGET_EXHAUSTED");
    else {
      entry.remediation_cycles += 1;
      entry.last_hypothesis = hypothesis;
    }
  } else if (type === "FAILURE") {
    const fingerprint = String(event.fingerprint ?? "").trim();
    if (!fingerprint) return { allowed: false, code: "FINGERPRINT_REQUIRED", reason: "Failure events require a fingerprint", ledger: next };
    entry.consecutive_failures = fingerprint === entry.failure_fingerprint ? entry.consecutive_failures + 1 : 1;
    entry.failure_fingerprint = fingerprint;
    if (entry.consecutive_failures >= 3 && entry.remediation_cycles >= 2) result = open(entry, "REPEATED_FAILURE");
    else if (entry.remediation_cycles >= 3) result = open(entry, "REMEDIATION_BUDGET_EXHAUSTED");
  } else if (type === "VERIFIER_REJECTION") {
    entry.verifier_rejections += 1;
    if (entry.verifier_rejections >= 2) result = open(entry, "VERIFIER_REJECTIONS");
  } else if (type === "NO_PROGRESS") {
    entry.no_progress_events += 1;
    if (entry.no_progress_events >= 2) result = open(entry, "NO_EVAL_PROGRESS");
  } else if (type === "SERVICE_FAILURE") {
    entry.service_failures += 1;
    if (entry.service_failures >= 2) result = open(entry, "REPEATED_SERVICE_FAILURE");
  } else if (type === "SUCCESS") {
    if (entry.state === "HALF_OPEN" && event.verifier_pass !== true) return { allowed: false, code: "VERIFIER_PASS_REQUIRED", reason: "HALF_OPEN closes only after verifier PASS", ledger: next };
    next.active_circuits[agent] = closeState();
    result = { allowed: true, code: "CLOSED", transition: "CLOSED" };
  } else return { allowed: false, code: "UNKNOWN_EVENT", reason: `Unknown event ${type}`, ledger: next };

  return { ...result, reason: result.transition === "OPEN" ? `${agent} opened: ${entry.open_reason}` : undefined, ledger: next };
}
