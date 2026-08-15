import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateResearchPacket } from "../reuse/validate-packet.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const failures = [];
const r0 = read(".agents/manifests/specialists/R0.json");
const a0 = read(".agents/manifests/agents/A0.json");
const a2 = read(".agents/manifests/agents/A2.json");
const packet = read(".agents/evidence/reuse/R0-bootstrap.json");
const contracts = read(".agents/context7/contracts.json");
const metrics = read(".agents/evals/metrics/research.json");
const heldOut = read(".agents/evals/held-out/cases.json").cases;
const skillPath = join(root, ".agents/skills/research-reuse-scout/SKILL.md");

if (!existsSync(skillPath)) failures.push("shared R0 skill missing");
if (!r0.execution_mode.read_only || r0.execution_mode.may_write || r0.write_scope.allow.length || !r0.write_scope.deny.includes("**/*")) failures.push("R0 is not read-only");
if (r0.capabilities.tools.some((tool) => /write|install|package/i.test(tool))) failures.push("R0 exposes mutation or installation tools");
if (JSON.stringify([...r0.parents].sort()) !== JSON.stringify(["A0", "A2"])) failures.push("R0 sponsors must be A0 and A2");
for (const parent of [a0, a2]) if (!parent.subagents.specialists.includes("R0") || !parent.communication.may_message.includes("R0")) failures.push(`${parent.identity.id} does not own R0`);
if (r0.circuit_breaker.thresholds.research_rounds !== 3 || r0.circuit_breaker.thresholds.shortlist !== 5 || r0.circuit_breaker.thresholds.finalists !== 3) failures.push("R0 research bounds drifted");
failures.push(...validateResearchPacket(packet));
try { execFileSync("git", ["merge-base", "--is-ancestor", packet.current_sha, "HEAD"], { cwd: root, stdio: "ignore" }); }
catch { failures.push("R0 bootstrap research SHA is not in candidate history"); }
for (const id of ["convex-components-reuse", "vercel-official-reuse-surfaces", "shadcn-registry-reuse"]) if (!contracts.evidence.some((item) => item.id === id)) failures.push(`missing official reuse evidence ${id}`);
if (!metrics.subjects.R0) failures.push("R0 quality metrics missing");
const tags = new Set(heldOut.filter((item) => item.subject === "R0").flatMap((item) => item.tags ?? []));
for (const tag of ["existing-project", "native-convex", "maintained-oss", "custom-smaller", "fashionable-inappropriate", "abandoned-readme", "incompatible-license", "operational-tradeoff"]) if (!tags.has(tag)) failures.push(`R0 held-out case missing ${tag}`);

if (failures.length) { console.error(failures.map((failure) => `FAIL ${failure}`).join("\n")); process.exit(1); }
console.log(`PASS R0 reuse gate: read-only, dual-sponsored, ${tags.size} adversarial cases, bounded 3/5/3`);
