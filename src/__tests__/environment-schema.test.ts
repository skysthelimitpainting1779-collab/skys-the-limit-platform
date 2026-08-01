import { describe, it, expect } from "vitest";
import { EnvironmentSchema, validateEnvironment } from "../lib/environment/schema";

describe("Environment Schema & Isolation Guards", () => {
  const validBaseEnv = {
    NODE_ENV: "development",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
    ENABLE_LIVE_EMAIL: "false",
    ENABLE_LIVE_STRIPE: "false",
    ENABLE_PRODUCTION_CONVEX: "false",
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
      WORKOS_API_KEY: "sk_live_123456789",
      VERCEL_ENV: "preview",
    };

    const result = EnvironmentSchema.safeParse(envWithLiveKey);
    expect(result.success).toBe(false);
  });

  it("permits live WorkOS key in production environment", () => {
    const envProd = {
      ...validBaseEnv,
      NODE_ENV: "production",
      WORKOS_API_KEY: "sk_live_123456789",
      VERCEL_ENV: "production",
    };

    const result = EnvironmentSchema.safeParse(envProd);
    expect(result.success).toBe(true);
  });

  it("blocks ENABLE_PRODUCTION_CONVEX=true in preview/development", () => {
    const env = {
      ...validBaseEnv,
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
});
