import { afterEach, describe, it, expect, vi } from "vitest";
import { EnvironmentSchema, validateEnvironment } from "../lib/environment/schema";

describe("Environment Schema & Isolation Guards", () => {
  afterEach(() => vi.unstubAllEnvs());
  const liveWorkOSKey = `${["sk", "live"].join("_")}_123456789`;
  const validBaseEnv = {
    NODE_ENV: "development",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
    ENABLE_LIVE_EMAIL: "false",
    ENABLE_LIVE_STRIPE: "false",
    ENABLE_PRODUCTION_CONVEX: "false",
  };
  const productionRequirements = {
    WORKOS_API_KEY: liveWorkOSKey,
    WORKOS_CLIENT_ID: "client_production",
    WORKOS_COOKIE_PASSWORD: "a-secure-cookie-password-over-32-characters",
    WORKOS_REDIRECT_URI: "https://example.com/auth/callback",
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: "https://example.com/auth/callback",
    WORKOS_WEBHOOK_SECRET: "environment-specific-webhook-secret",
    NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: "organizations_production",
    BLOB_READ_WRITE_TOKEN: "environment-specific-blob-token",
  };
  const previewRequirements = {
    ...productionRequirements,
    WORKOS_API_KEY: `${["sk", "test"].join("_")}_preview_key`,
    WORKOS_CLIENT_ID: "client_preview",
    WORKOS_REDIRECT_URI: "https://preview.example.com/auth/callback",
    NEXT_PUBLIC_WORKOS_REDIRECT_URI:
      "https://preview.example.com/auth/callback",
    NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: "organizations_preview",
  };

  it("parses valid environment configuration", () => {
    const result = EnvironmentSchema.safeParse(validBaseEnv);
    expect(result.success).toBe(true);
  });

  it("fails validation when NEXT_PUBLIC_CONVEX_URL is missing", () => {
    const invalidEnv = { ...validBaseEnv };
    delete (invalidEnv as Record<string, string>).NEXT_PUBLIC_CONVEX_URL;

    const result = EnvironmentSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });

  it("blocks live WorkOS key outside production environment", () => {
    const envWithLiveKey = {
      ...validBaseEnv,
      WORKOS_API_KEY: liveWorkOSKey,
      VERCEL_ENV: "preview",
    };

    const result = EnvironmentSchema.safeParse(envWithLiveKey);
    expect(result.success).toBe(false);
  });

  it("permits live WorkOS key in production environment", () => {
    const envProd = {
      ...validBaseEnv,
      ...productionRequirements,
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    };

    const result = EnvironmentSchema.safeParse(envProd);
    expect(result.success).toBe(true);
  });

  it("blocks ENABLE_PRODUCTION_CONVEX=true in preview/development", () => {
    const env = {
      ...validBaseEnv,
      ...previewRequirements,
      VERCEL_ENV: "preview",
      ENABLE_PRODUCTION_CONVEX: "true",
    };

    expect(() => validateEnvironment(env)).toThrow(
      "BLOCKED: ENABLE_PRODUCTION_CONVEX=true is not permitted in Preview/Development environments."
    );
  });

  it("blocks ENABLE_LIVE_STRIPE=true in preview/development", () => {
    const env = {
      ...validBaseEnv,
      ...previewRequirements,
      VERCEL_ENV: "preview",
      ENABLE_LIVE_STRIPE: "true",
    };

    expect(() => validateEnvironment(env)).toThrow(
      "BLOCKED: ENABLE_LIVE_STRIPE=true is not permitted in Preview/Development environments."
    );
  });

  it("blocks ENABLE_LIVE_EMAIL=true in preview/development", () => {
    const env = {
      ...validBaseEnv,
      ...previewRequirements,
      VERCEL_ENV: "preview",
      ENABLE_LIVE_EMAIL: "true",
    };

    expect(() => validateEnvironment(env)).toThrow(
      "BLOCKED: ENABLE_LIVE_EMAIL=true is not permitted in Preview/Development environments."
    );
  });

  it("allows production feature flags when VERCEL_ENV=production", () => {
    const env = {
      ...validBaseEnv,
      ...productionRequirements,
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      ENABLE_PRODUCTION_CONVEX: "true",
      ENABLE_LIVE_STRIPE: "true",
      ENABLE_LIVE_EMAIL: "true",
    };

    const validated = validateEnvironment(env);
    expect(validated.ENABLE_PRODUCTION_CONVEX).toBe("true");
    expect(validated.ENABLE_LIVE_STRIPE).toBe("true");
    expect(validated.ENABLE_LIVE_EMAIL).toBe("true");
  });

  it("fails closed when production WorkOS, tenant, or Blob configuration is incomplete", () => {
    const result = EnvironmentSchema.safeParse({
      ...validBaseEnv,
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    });
    expect(result.success).toBe(false);
  });

  it("rejects copied placeholder credentials in deployment environments", () => {
    const result = EnvironmentSchema.safeParse({
      ...validBaseEnv,
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      WORKOS_API_KEY: `${["sk", "test"].join("_")}_REPLACE_ME`,
      WORKOS_CLIENT_ID: "client_REPLACE_ME",
      WORKOS_COOKIE_PASSWORD: "generate_32_character_secret_password_here",
      WORKOS_REDIRECT_URI: "http://localhost:3000/auth/callback",
      NEXT_PUBLIC_WORKOS_REDIRECT_URI: "http://localhost:3000/auth/callback",
      WORKOS_WEBHOOK_SECRET: "replace_with_environment_specific_webhook_secret",
      WORKOS_ACTION_SECRET: "replace_with_environment_specific_action_secret",
      NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: "organizations_REPLACE_ME",
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_REPLACE_ME",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched server and AuthKit redirect URIs", () => {
    const result = EnvironmentSchema.safeParse({
      ...validBaseEnv,
      ...previewRequirements,
      VERCEL_ENV: "preview",
      WORKOS_REDIRECT_URI: "https://preview.example.com/auth/callback",
      NEXT_PUBLIC_WORKOS_REDIRECT_URI:
        "https://other-preview.example.com/auth/callback",
    });
    expect(result.success).toBe(false);
  });

  it("does not allow deployment builds to bypass environment validation", () => {
    expect(() =>
      validateEnvironment({
        ...validBaseEnv,
        VERCEL_ENV: "production",
        SKIP_ENV_VALIDATION: "true",
      }),
    ).toThrow("SKIP_ENV_VALIDATION is not permitted");
  });

  it("invokes environment validation from the Vercel build boundary", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
    vi.resetModules();
    await expect(import("../../next.config")).rejects.toThrow(
      "SKIP_ENV_VALIDATION is not permitted",
    );
  });
});
