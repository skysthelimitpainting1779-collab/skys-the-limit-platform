#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const roots = [
  "src/app",
  "src/components/marketing",
  "src/components/platform",
];
const failures = [];
const forbiddenClaims = [
  "prevailing wage certified",
  "certified payroll",
  "osha 30",
  "background-checked",
  "bonding capacity",
  "zero-voc",
  "low-voc",
  "factory-grade",
  "fully compliant",
  "scalable workforce",
  "night and weekend shifts",
  "secure online payment processing",
  "pay deposits",
];
const rawPalettePattern =
  /(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:\d{2,3}|950)\b/;

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const item = path.join(directory, entry);
    const stats = statSync(item);
    if (stats.isDirectory()) return walk(item);
    return item.endsWith(".tsx") ? [item] : [];
  });
}

for (const file of roots.flatMap(walk)) {
  const content = readFileSync(file, "utf8");
  const lower = content.toLowerCase();

  for (const claim of forbiddenClaims) {
    if (lower.includes(claim)) failures.push(`${file}: unsupported claim '${claim}'`);
  }
  if (/#[0-9a-f]{3,8}\b/i.test(content)) {
    failures.push(`${file}: raw hex color detected`);
  }
  if (rawPalettePattern.test(content)) {
    failures.push(`${file}: raw palette utility detected; use semantic design tokens`);
  }
  if (/\b(?:bg|text)-(?:white|black)\b/.test(content)) {
    failures.push(`${file}: raw white/black utility detected; use semantic design tokens`);
  }
}

if (failures.length > 0) {
  console.error("Content integrity validation FAILED:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("content integrity: ok");
