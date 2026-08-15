#!/usr/bin/env node
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, ".agents", "tools", "oss-tools.json"), "utf8"));

function platformKey() {
  return `${process.platform}-${process.arch}`;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function ensureTool(name) {
  const tool = manifest.tools[name];
  if (!tool) throw new Error(`Unknown OSS tool: ${name}`);
  const key = platformKey();
  const asset = tool.assets[key];
  const binaryName = tool.binary[key];
  if (!asset || !binaryName) throw new Error(`${name} ${tool.version} has no certified ${key} mapping`);

  const installDir = join(root, "node_modules", ".cache", "stl-oss-tools", `${name}-${tool.version}-${key}`);
  const binaryPath = join(installDir, binaryName);
  if (existsSync(binaryPath)) return { binaryPath, tool, cache: "HIT" };

  mkdirSync(installDir, { recursive: true });
  const url = `https://github.com/${tool.repository}/releases/download/${tool.tag}/${asset.name}`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Unable to download ${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = sha256(bytes);
  if (actual !== asset.sha256) {
    rmSync(installDir, { recursive: true, force: true });
    throw new Error(`${name} asset digest mismatch: expected ${asset.sha256}, received ${actual}`);
  }

  const archivePath = join(installDir, asset.name);
  writeFileSync(archivePath, bytes);
  if (asset.archive === "raw") {
    writeFileSync(binaryPath, bytes);
    rmSync(archivePath, { force: true });
  } else {
    const extraction = spawnSync("tar", ["-xf", archivePath, "-C", installDir], { encoding: "utf8" });
    if (extraction.status !== 0 || !existsSync(binaryPath)) {
      rmSync(installDir, { recursive: true, force: true });
      throw new Error(`Unable to extract ${asset.name}: ${extraction.stderr || extraction.stdout}`);
    }
  }
  if (process.platform !== "win32") chmodSync(binaryPath, 0o755);
  return { binaryPath, tool, cache: "MISS" };
}

export async function runTool(name, args, options = {}) {
  const installed = await ensureTool(name);
  const result = spawnSync(installed.binaryPath, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
  return { ...result, installed };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [name, separator, ...args] = process.argv.slice(2);
  if (!name || separator !== "--") {
    console.error("Usage: node scripts/oss/toolchain.mjs <tool> -- [arguments]");
    process.exit(2);
  }
  try {
    const result = await runTool(name, args, { stdio: "inherit" });
    process.exit(result.status ?? 1);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
