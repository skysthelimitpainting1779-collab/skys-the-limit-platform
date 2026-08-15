import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const contracts = read(".agents/context7/contracts.json");
const routing = read(".agents/context7/routing.json");
const packageJson = read("package.json");
const failures = [];
const required = ["next", "react", "convex", "workos_authkit", "tailwind", "motion", "zod", "vitest", "vercel", "github_actions", "shadcn", "radix", "playwright", "axe_core", "stripe", "resend", "posthog"];

for (const name of required) {
  const entry = contracts.libraries[name];
  if (!entry?.library_id?.startsWith("/")) failures.push(`${name} has no resolved Context7 library ID`);
  if (entry?.source_reputation !== "High") failures.push(`${name} does not use a high-reputation source`);
  if (entry?.package) {
    const installed = packageJson.dependencies?.[entry.package] ?? packageJson.devDependencies?.[entry.package];
    if (!installed) failures.push(`${name} package ${entry.package} is not installed`);
    else if (!String(installed).includes(String(entry.installed).split(".")[0])) failures.push(`${name} installed version drift: ${installed} vs ${entry.installed}`);
  }
}
for (const evidence of contracts.evidence) {
  for (const field of routing.evidence_requires) if (!evidence[field] || (Array.isArray(evidence[field]) && !evidence[field].length)) failures.push(`${evidence.id} missing ${field}`);
}
if (!contracts.evidence.some((item) => item.id === "next-16-proxy" && /proxy\.ts/.test(item.contract) && /Node\.js/.test(item.contract))) failures.push("Next.js 16 proxy contract missing");
if (!contracts.evidence.some((item) => item.id === "workos-authkit-server-session" && /never caller input/.test(item.contract))) failures.push("WorkOS server identity contract missing");
if (!contracts.evidence.some((item) => item.id === "convex-server-auth-indexes" && /ctx\.auth\.getUserIdentity/.test(item.contract))) failures.push("Convex server auth contract missing");
if (routing.required_when.length < 3 || routing.skip_when.length < 4) failures.push("Context7 routing is not task-sensitive");

if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`PASS Context7 contract: ${required.length} resolved libraries, ${contracts.evidence.length} version-sensitive invariants`);
