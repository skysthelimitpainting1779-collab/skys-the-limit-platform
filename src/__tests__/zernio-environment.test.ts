import { describe, expect, it } from "vitest";

import {
  EnvironmentSchema,
  validateEnvironment,
} from "../lib/environment/schema";

const validBaseEnv = {
  NODE_ENV: "development",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
  ENABLE_LIVE_EMAIL: "false",
  ENABLE_LIVE_SOCIAL: "false",
  ENABLE_LIVE_STRIPE: "false",
  ENABLE_PRODUCTION_CONVEX: "false",
};

describe("Zernio environment contract", () => {
  it("accepts a server-only Zernio key while publishing remains disabled", () => {
    const result = EnvironmentSchema.safeParse({
      ...validBaseEnv,
      ZERNIO_API_KEY: "zernio_test_key",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a copied placeholder Zernio credential", () => {
    const result = EnvironmentSchema.safeParse({
      ...validBaseEnv,
      ZERNIO_API_KEY: "zernio_REPLACE_ME",
    });

    expect(result.success).toBe(false);
  });

  it("requires a real key when live social publishing is enabled", () => {
    const result = EnvironmentSchema.safeParse({
      ...validBaseEnv,
      ENABLE_LIVE_SOCIAL: "true",
    });

    expect(result.success).toBe(false);
  });

  it("blocks live social publishing outside production", () => {
    expect(() =>
      validateEnvironment({
        ...validBaseEnv,
        ZERNIO_API_KEY: "zernio_test_key",
        ENABLE_LIVE_SOCIAL: "true",
      }),
    ).toThrow(
      "ENABLE_LIVE_SOCIAL=true is not permitted in Preview/Development environments",
    );
  });
});
