import fs from "fs";

const REQUIRED_VARS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CONVEX_URL",
  "WORKOS_API_KEY",
  "WORKOS_CLIENT_ID",
  "WORKOS_COOKIE_PASSWORD",
  "WORKOS_REDIRECT_URI",
  "WORKOS_ORGANIZATION_ID",
  "WORKOS_WEBHOOK_SECRET",
  "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
  "BLOB_READ_WRITE_TOKEN",
  "LEAD_INTAKE_SECRET",
];

const signature = (...parts) => new RegExp(parts.join(""));
const NEVER_COMMIT_PATTERNS = [
  signature("sk", "_live_"),
  signature("pk", "_live_"),
  signature("AK", "IA[A-Z0-9]{16}"),
  signature("gh", "p_[a-zA-Z0-9]{36}"),
];

function validateEnvironmentContract() {
  const examplePath = ".env.example";

  if (!fs.existsSync(examplePath)) {
    console.error("✗ .env.example not found. Run: cp .env.example .env.local");
    process.exit(1);
  }

  const exampleContent = fs.readFileSync(examplePath, "utf-8");

  let hasErrors = false;

  for (const varName of REQUIRED_VARS) {
    if (!exampleContent.includes(varName)) {
      console.error(`✗ Missing required variable in .env.example: ${varName}`);
      hasErrors = true;
    }
  }

  // Scan for accidentally committed real values in .env.example
  for (const pattern of NEVER_COMMIT_PATTERNS) {
    if (pattern.test(exampleContent)) {
      console.error(`✗ SECURITY: .env.example contains a real credential matching ${pattern}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log("✓ Environment contract validated — .env.example is clean and complete.");
}

validateEnvironmentContract();
