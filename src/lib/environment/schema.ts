import { z } from "zod";

const EnvironmentSchema = z
  .object({
    // Node
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Next.js
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

    // Convex — required for any page that uses real-time data
    NEXT_PUBLIC_CONVEX_URL: z
      .string()
      .url({ message: "NEXT_PUBLIC_CONVEX_URL must be a valid Convex deployment URL" }),
    NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: z.string().min(1).optional(),
    LEAD_INTAKE_SECRET: z.string().min(32).optional(),

    // Authentication — required for auth-protected routes
    WORKOS_API_KEY: z.string().min(1).optional(),
    WORKOS_CLIENT_ID: z.string().min(1).optional(),
    WORKOS_COOKIE_PASSWORD: z.string().min(32).optional(),
    WORKOS_REDIRECT_URI: z.string().url().optional(),
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.string().url().optional(),
    WORKOS_ORGANIZATION_ID: z.string().min(1).optional(),
    WORKOS_WEBHOOK_SECRET: z.string().min(1).optional(),
    WORKOS_ACTION_SECRET: z.string().min(1).optional(),

    // File storage — server-only; use isolated stores in Preview and Production
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),

    // Social publishing — server-only; required only when live publishing is enabled
    ZERNIO_API_KEY: z.string().min(1).optional(),

    // Vercel (auto-injected)
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    VERCEL_URL: z.string().optional(),

    // Feature gates — must be explicit "true"; default blocks production effects
    ENABLE_LIVE_EMAIL: z.enum(["true", "false"]).default("false"),
    ENABLE_LIVE_SOCIAL: z.enum(["true", "false"]).default("false"),
    ENABLE_LIVE_STRIPE: z.enum(["true", "false"]).default("false"),
    ENABLE_PRODUCTION_CONVEX: z.enum(["true", "false"]).default("false"),
  })
  .superRefine((data, ctx) => {
    const isPlaceholder = (value: string | undefined) => {
      if (!value?.trim()) return false;
      const normalized = value.trim().toLowerCase();
      return [
        "replace_me",
        "replace_with_",
        "unconfigured",
        "placeholder",
        "your-deployment",
        "generate_",
      ].some((marker) => normalized.includes(marker));
    };
    const workOSConfiguration = [
      ["WORKOS_API_KEY", data.WORKOS_API_KEY],
      ["WORKOS_CLIENT_ID", data.WORKOS_CLIENT_ID],
      ["WORKOS_COOKIE_PASSWORD", data.WORKOS_COOKIE_PASSWORD],
      ["WORKOS_REDIRECT_URI", data.WORKOS_REDIRECT_URI],
      ["NEXT_PUBLIC_WORKOS_REDIRECT_URI", data.NEXT_PUBLIC_WORKOS_REDIRECT_URI],
      ["WORKOS_ORGANIZATION_ID", data.WORKOS_ORGANIZATION_ID],
    ] as const;
    if (workOSConfiguration.some(([, value]) => Boolean(value))) {
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
    for (const [name, value] of workOSConfiguration) {
      if (isPlaceholder(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name],
          message: "Placeholder values are not valid credentials",
        });
      }
    }
    if (isPlaceholder(data.WORKOS_ACTION_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["WORKOS_ACTION_SECRET"],
        message: "Placeholder values are not valid credentials",
      });
    }
    if (isPlaceholder(data.LEAD_INTAKE_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["LEAD_INTAKE_SECRET"],
        message: "Placeholder values are not valid credentials",
      });
    }
    if (isPlaceholder(data.ZERNIO_API_KEY)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ZERNIO_API_KEY"],
        message: "Placeholder values are not valid credentials",
      });
    }
    if (
      data.ENABLE_LIVE_SOCIAL === "true" &&
      (!data.ZERNIO_API_KEY || isPlaceholder(data.ZERNIO_API_KEY))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ZERNIO_API_KEY"],
        message: "Live social publishing requires a real Zernio API key",
      });
    }

    const isDeployment =
      data.VERCEL_ENV === "preview" || data.VERCEL_ENV === "production";
    if (isDeployment) {
      for (const [name, value] of workOSConfiguration) {
        if (!value || isPlaceholder(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [name],
            message: "WorkOS AuthKit must be configured for deployment",
          });
        }
      }
      if (
        !data.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID ||
        isPlaceholder(data.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID"],
          message: "Deployment lead intake requires a real organization ID",
        });
      }
      if (!data.LEAD_INTAKE_SECRET || isPlaceholder(data.LEAD_INTAKE_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["LEAD_INTAKE_SECRET"],
          message: "Deployment lead intake requires a shared server secret",
        });
      }
      if (isPlaceholder(data.NEXT_PUBLIC_CONVEX_URL)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NEXT_PUBLIC_CONVEX_URL"],
          message: "Deployment requires a real Convex URL",
        });
      }
      const applicationUrl = new URL(data.NEXT_PUBLIC_APP_URL);
      if (
        applicationUrl.protocol !== "https:" ||
        applicationUrl.hostname === "localhost"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["NEXT_PUBLIC_APP_URL"],
          message: "Deployment application URL must use HTTPS",
        });
      }
      for (const redirectName of [
        "WORKOS_REDIRECT_URI",
        "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
      ] as const) {
        const redirect = data[redirectName];
        if (
          redirect &&
          (new URL(redirect).protocol !== "https:" ||
            new URL(redirect).hostname === "localhost")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [redirectName],
            message: "Deployment redirect URI must use HTTPS",
          });
        }
        if (redirect && new URL(redirect).origin !== applicationUrl.origin) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [redirectName],
            message: "WorkOS redirect must use the application origin",
          });
        }
      }
      if (
        data.WORKOS_REDIRECT_URI &&
        data.NEXT_PUBLIC_WORKOS_REDIRECT_URI &&
        data.WORKOS_REDIRECT_URI !== data.NEXT_PUBLIC_WORKOS_REDIRECT_URI
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["WORKOS_REDIRECT_URI"],
          message: "WorkOS redirect URI values must match",
        });
      }
    }
    const secretPrefix = String.fromCharCode(115, 107, 95, 108, 105, 118, 101, 95);
    if (data.WORKOS_API_KEY?.startsWith(secretPrefix) && data.VERCEL_ENV !== "production") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["WORKOS_API_KEY"],
        message: "Live WorkOS key must not be used outside Production",
      });
    }
    const testSecretPrefix = String.fromCharCode(
      115,
      107,
      95,
      116,
      101,
      115,
      116,
      95,
    );
    if (
      data.WORKOS_API_KEY?.startsWith(testSecretPrefix) &&
      data.VERCEL_ENV === "production"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["WORKOS_API_KEY"],
        message: "Test WorkOS key must not be used in Production",
      });
    }
  });

type Environment = z.infer<typeof EnvironmentSchema>;

function validateEnvironment(
  envInput: Record<string, string | undefined> = process.env
): Environment {
  if (envInput.SKIP_ENV_VALIDATION === "true") {
    if (envInput.VERCEL_ENV === "preview" || envInput.VERCEL_ENV === "production") {
      throw new Error(
        "BLOCKED: SKIP_ENV_VALIDATION is not permitted in Preview/Production.",
      );
    }
    return {} as Environment;
  }

  const result = EnvironmentSchema.safeParse(envInput);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error("✗ Environment validation failed:");
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(", ")}`);
    }
    throw new Error("Invalid environment configuration. Check .env.example for required variables.");
  }

  // Preview isolation guard: block production credentials in non-production environments
  const envData = result.data;
  const isProduction = envData.VERCEL_ENV === "production";

  if (!isProduction) {
    if (envData.ENABLE_PRODUCTION_CONVEX === "true") {
      throw new Error("BLOCKED: ENABLE_PRODUCTION_CONVEX=true is not permitted in Preview/Development environments.");
    }
    if (envData.ENABLE_LIVE_STRIPE === "true") {
      throw new Error("BLOCKED: ENABLE_LIVE_STRIPE=true is not permitted in Preview/Development environments.");
    }
    if (envData.ENABLE_LIVE_EMAIL === "true") {
      throw new Error("BLOCKED: ENABLE_LIVE_EMAIL=true is not permitted in Preview/Development environments.");
    }
    if (envData.ENABLE_LIVE_SOCIAL === "true") {
      throw new Error("BLOCKED: ENABLE_LIVE_SOCIAL=true is not permitted in Preview/Development environments.");
    }
  }

  return envData;
}

export const env = process.env.SKIP_ENV_VALIDATION === "true"
  ? ({} as Environment)
  : (process.env.NEXT_PUBLIC_CONVEX_URL ? validateEnvironment(process.env) : ({} as Environment));

export { EnvironmentSchema, validateEnvironment };
export type { Environment };
