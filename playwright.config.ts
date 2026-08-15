import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/playwright",
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  retries: 0,
  reporter: process.env.CI ? [["dot"], ["json", { outputFile: "test-results/playwright/report.json" }]] : "list",
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3100",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 -p 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          SKIP_ENV_VALIDATION: "true",
          NEXT_PUBLIC_DEPLOYMENT_TIER: "test",
          ENABLE_EXTERNAL_EFFECTS: "false",
          NEXT_PUBLIC_CONVEX_URL: "https://ci-placeholder.convex.cloud",
          WORKOS_CLIENT_ID: "client_local_ci_fail_closed",
          WORKOS_API_KEY: "sk_test_local_ci_fail_closed",
          WORKOS_COOKIE_PASSWORD: "local_ci_cookie_password_is_at_least_32_chars",
          WORKOS_REDIRECT_URI: "http://127.0.0.1:3100/auth/callback",
          NEXT_PUBLIC_WORKOS_REDIRECT_URI: "http://127.0.0.1:3100/auth/callback",
          WORKOS_ORGANIZATION_ID: "org_local_ci_fail_closed",
          WORKOS_WEBHOOK_SECRET: "whsec_local_ci_fail_closed",
          WORKOS_ACTION_SECRET: "action_local_ci_fail_closed",
          LEAD_INTAKE_SECRET: "local_ci_lead_intake_proof_key_32_chars_minimum",
        },
      },
});
