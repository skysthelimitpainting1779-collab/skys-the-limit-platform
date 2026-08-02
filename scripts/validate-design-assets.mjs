import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const REPO_ROOT = process.cwd();
const REGISTRY_PATH = path.join(REPO_ROOT, 'src/design/assets/registry.ts');

if (!fs.existsSync(REGISTRY_PATH)) {
  console.error('FAIL: src/design/assets/registry.ts is missing!');
  process.exit(1);
}

const registryContent = fs.readFileSync(REGISTRY_PATH, 'utf8');

// Ensure no original PNG source files are committed under public/ or src/
const findFiles = (dir, ext) => {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, ext));
    } else if (file.endsWith(ext)) {
      results.push(filePath);
    }
  }
  return results;
};

const committedPngs = findFiles(path.join(REPO_ROOT, 'public/design-lab'), '.png');
if (committedPngs.length > 0) {
  console.error('FAIL: Original PNG source files found in public/design-lab! Only WebP/AVIF derivatives allowed.');
  committedPngs.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

// Read public candidate WebP files
const candidateWebps = findFiles(path.join(REPO_ROOT, 'public/design-lab/candidates'), '.webp');
if (candidateWebps.length === 0) {
  console.error('FAIL: No candidate WebP assets found in public/design-lab/candidates!');
  process.exit(1);
}

// Verify checksums and registry alignment
for (const webpPath of candidateWebps) {
  const buf = fs.readFileSync(webpPath);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  const relPath = '/' + path.relative(path.join(REPO_ROOT, 'public'), webpPath).replace(/\\/g, '/');

  if (!registryContent.includes(relPath)) {
    console.error(`FAIL: Asset ${relPath} missing from src/design/assets/registry.ts!`);
    process.exit(1);
  }

  if (!registryContent.includes(hash)) {
    console.error(`FAIL: Asset ${relPath} checksum ${hash} missing or mismatched in registry.ts!`);
    process.exit(1);
  }
}

console.log(`✓ Design assets contract validated — ${candidateWebps.length} candidate assets verified in registry.ts.`);
