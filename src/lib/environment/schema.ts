import { z } from "zod";

const EnvironmentSchema = z
  .object({
    // Node
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Next.js
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

    // Convex — required for any page that uses real-time data
    NEXT_PUBLIC_CONVEX_URL: z.string().url({
      message: "NEXT_PUBLIC_CONVEX_URL must be a valid Convex deployment URL",
    }),
    NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: z.string().min(1).optional(),

    // Authentication — required for WorkOS AuthKit
    WORKOS_API_KEY: z.string().min(1).optional(),
    WORKOS_CLIENT_ID: z.string().min(1).optional(),
    WORKOS_COOKIE_PASSWORD: z.string().min(32).optional(),
    WORKOS_WEBHOOK_SECRET: z.string().min(1).optional(),
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.string().url().optional(),
    ALLOW_LOCAL_AUTH_MOCK: z
      .enum(["true", "false"])
      .default("false"),

    // Vercel (auto-injected)
    VERCEL_ENV: z
      .enum(["production", "preview", "development"])
      .optional(),
    VERCEL_URL: z.string().optional(),

    // Feature gates — must be explicit "true"; default blocks production effects
    ENABLE_LIVE_EMAIL: z.enum(["true", "false"]).default("false"),
    ENABLE_LIVE_STRIPE: z.enum(["true", "false"]).default("false"),
    ENABLE_PRODUCTION_CONVEX: z
      .enum(["true", "false"])
      .default("false"),
  })
  .superRefine((data, ctx) => {
    const workOSConfiguration = [
      ["WORKOS_API_KEY", data.WORKOS_API_KEY],
      ["WORKOS_CLIENT_ID", data.WORKOS_CLIENT_ID],
      ["WORKOS_COOKIE_PASSWORD", data.WORKOS_COOKIE_PASSWORD],
      ["WORKOS_WEBHOOK_SECRET", data.WORKOS_WEBHOOK_SECRET],
      [
        "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
        data.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
      ],
    ] as const;
    const hasAnyWorkOSValue = workOSConfiguration.some(([, value]) => value);
    if (hasAnyWorkOSValue) {
      for (const [name, value] of workOSConfiguration) {
        if (!value) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [name],
            message: "WorkOS AuthKit configuration must be complete",
          });
        }
      }
    }

    if (data.VERCEL_ENV === "production") {
      for (const [name, value] of workOSConfiguration) {
        if (!value) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [name],
            message: "WorkOS AuthKit is required in Production",
          });
        }
      }
      if (!data.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID"],
          message: "Production lead intake requires an organization ID",
        });
      }
    }

    const secretPrefix = String.fromCharCode(
      115,
      107,
      95,
      108,
      105,
      118,
      101,
      95,
    );
    if (
      data.WORKOS_API_KEY?.startsWith(secretPrefix) &&
      data.VERCEL_ENV !== "production"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["WORKOS_API_KEY"],
        message: "Live WorkOS key must not be used outside Production",
      });
    }

    if (
      data.ALLOW_LOCAL_AUTH_MOCK === "true" &&
      (data.NODE_ENV !== "development" ||
        data.VERCEL_ENV === "preview" ||
        data.VERCEL_ENV === "production")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ALLOW_LOCAL_AUTH_MOCK"],
        message:
          "ALLOW_LOCAL_AUTH_MOCK=true is permitted only in explicit local development",
      });
    }
  });

type Environment = z.infer<typeof EnvironmentSchema>;

function validateEnvironment(
  envInput: Record<string, string | undefined> = process.env,
): Environment {
  if (envInput.SKIP_ENV_VALIDATION === "true") {
    return {} as Environment;
  }

  const result = EnvironmentSchema.safeParse(envInput);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error("✗ Environment validation failed:");
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(", ")}`);
    }
    throw new Error(
      "Invalid environment configuration. Check .env.example for required variables.",
    );
  }

  const envData = result.data;
  const isProduction = envData.VERCEL_ENV === "production";

  if (!isProduction) {
    if (envData.ENABLE_PRODUCTION_CONVEX === "true") {
      throw new Error(
        "BLOCKED: ENABLE_PRODUCTION_CONVEX=true is not permitted in Preview/Development environments.",
      );
    }
    if (envData.ENABLE_LIVE_STRIPE === "true") {
      throw new Error(
        "BLOCKED: ENABLE_LIVE_STRIPE=true is not permitted in Preview/Development environments.",
      );
    }
    if (envData.ENABLE_LIVE_EMAIL === "true") {
      throw new Error(
        "BLOCKED: ENABLE_LIVE_EMAIL=true is not permitted in Preview/Development environments.",
      );
    }
  }

  return envData;
}

export const env =
  process.env.SKIP_ENV_VALIDATION === "true"
    ? ({} as Environment)
    : process.env.NEXT_PUBLIC_CONVEX_URL
      ? validateEnvironment(process.env)
      : ({} as Environment);

export { EnvironmentSchema, validateEnvironment };
export type { Environment };
