import fs from "fs";

const REQUIRED_VARS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CONVEX_URL",
];

const NEVER_COMMIT_PATTERNS = [
  /sk_live_/,
  /pk_live_/,
  /AKIA[A-Z0-9]{16}/,
  /ghp_[a-zA-Z0-9]{36}/,
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
