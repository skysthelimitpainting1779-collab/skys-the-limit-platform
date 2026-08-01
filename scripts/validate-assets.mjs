#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const manifestPath = path.join(process.cwd(), "public/assets-manifest.json");
const trackedDirectories = ["public/brand", "public/images"];
const failures = [];

if (!existsSync(manifestPath)) {
  console.error("Asset validation FAILED: public/assets-manifest.json is missing");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest.assets)) failures.push("manifest.assets must be an array");
if (!Array.isArray(manifest.pendingSources)) failures.push("manifest.pendingSources must be an array");

const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
const declaredPaths = new Set();

for (const asset of assets) {
  for (const field of [
    "path",
    "title",
    "classification",
    "source",
    "driveFileId",
    "contentOwner",
    "approvedUses",
    "prohibitedUses",
    "lastReviewed",
    "sha256",
  ]) {
    if (!asset[field] || (Array.isArray(asset[field]) && asset[field].length === 0)) {
      failures.push(`${asset.path ?? "asset"}: missing ${field}`);
    }
  }

  if (asset.classification !== "public-approved") {
    failures.push(`${asset.path}: only public-approved assets may live in public/`);
  }
  if (/^(PENDING|DRIVE-|placeholder|sha256-approved)/i.test(asset.driveFileId ?? "")) {
    failures.push(`${asset.path}: placeholder Drive ID is not permitted`);
  }
  if (!/^[a-f0-9]{64}$/i.test(asset.sha256 ?? "")) {
    failures.push(`${asset.path}: sha256 must be a real 64-character digest`);
  }
  if (!existsSync(asset.path)) failures.push(`${asset.path}: declared file is missing`);
  declaredPaths.add(asset.path);
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const item = path.join(directory, entry).replaceAll("\\", "/");
    const stats = statSync(item);
    if (stats.isDirectory()) return walk(item);
    if (entry === ".gitkeep" || entry === ".DS_Store") return [];
    return [item];
  });
}

for (const file of trackedDirectories.flatMap(walk)) {
  if (!declaredPaths.has(file)) failures.push(`${file}: public file has no manifest entry`);
}

for (const source of manifest.pendingSources ?? []) {
  if (!source.driveFileId || /^(PENDING|DRIVE-)/i.test(source.driveFileId)) {
    failures.push(`${source.title ?? "pending source"}: real Drive file ID required`);
  }
  if (source.status !== "awaiting-binary-import") {
    failures.push(`${source.title}: pending source must explicitly state awaiting-binary-import`);
  }
}

if (failures.length > 0) {
  console.error("Asset validation FAILED:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`assets: ok (${assets.length} committed, ${manifest.pendingSources.length} pending)`);
