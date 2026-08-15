#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureTool } from "./toolchain.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const port = 3107;
const baseUrl = `http://127.0.0.1:${port}`;
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const environment = {
  ...process.env,
  SKIP_ENV_VALIDATION: "true",
  NEXT_PUBLIC_DEPLOYMENT_TIER: "test",
  ENABLE_EXTERNAL_EFFECTS: "false",
  NEXT_PUBLIC_CONVEX_URL: "https://ci-placeholder.convex.cloud",
  WORKOS_CLIENT_ID: "client_local_ci_fail_closed",
  WORKOS_API_KEY: "sk_test_local_ci_fail_closed",
  WORKOS_COOKIE_PASSWORD: "local_ci_cookie_password_is_at_least_32_chars",
  WORKOS_REDIRECT_URI: `${baseUrl}/auth/callback`,
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: `${baseUrl}/auth/callback`,
  WORKOS_ORGANIZATION_ID: "org_local_ci_fail_closed",
  WORKOS_WEBHOOK_SECRET: "whsec_local_ci_fail_closed",
  WORKOS_ACTION_SECRET: "action_local_ci_fail_closed",
  LEAD_INTAKE_SECRET: "local_ci_lead_intake_proof_key_32_chars_minimum",
};

const server = spawn(
  process.execPath,
  [nextBin, "dev", "--hostname", "127.0.0.1", "-p", String(port)],
  { cwd: root, env: environment, stdio: ["ignore", "pipe", "pipe"] },
);
let diagnostics = "";
for (const stream of [server.stdout, server.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    diagnostics = `${diagnostics}${chunk}`.slice(-8_000);
  });
}

async function waitUntilReady() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next.js exited early:\n${diagnostics}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error(`Local Next.js server did not become ready:\n${diagnostics}`);
}

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveClose) => server.once("close", resolveClose)),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

try {
  await waitUntilReady();
  const k6 = await ensureTool("k6");
  const startedAt = Date.now();
  const result = spawnSync(
    k6.binaryPath,
    ["run", "--quiet", "tests/load/estimate-validation.js"],
    { cwd: root, env: { ...environment, BASE_URL: baseUrl }, encoding: "utf8", timeout: 60_000 },
  );
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  console.log(JSON.stringify({ passed: result.status === 0, runtime_ms: Date.now() - startedAt, server: "local-only", production_effects: false }));
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await stopServer();
}
