import { z } from "zod";

const EnvironmentSchema = z.object({
  // Node
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Convex — required for any page that uses real-time data
  NEXT_PUBLIC_CONVEX_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_CONVEX_URL must be a valid Convex deployment URL" }),

  // Authentication — required for auth-protected routes
  WORKOS_API_KEY: z
    .string()
    .min(1, "WORKOS_API_KEY is required")
    .refine((v) => !v.startsWith("sk_live_") || process.env.VERCEL_ENV === "production", {
      message: "Live WorkOS key must not be used outside Production",
    })
    .optional(),

  WORKOS_CLIENT_ID: z.string().min(1).optional(),

  NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.string().url().optional(),

  // Vercel (auto-injected)
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().optional(),

  // Feature gates — must be explicit "true"; default blocks production effects
  ENABLE_LIVE_EMAIL: z.enum(["true", "false"]).default("false"),
  ENABLE_LIVE_STRIPE: z.enum(["true", "false"]).default("false"),
  ENABLE_PRODUCTION_CONVEX: z.enum(["true", "false"]).default("false"),
});

type Environment = z.infer<typeof EnvironmentSchema>;

function validateEnvironment(): Environment {
  // Skip during build if explicitly opted out
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return {} as Environment;
  }

  const result = EnvironmentSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error("✗ Environment validation failed:");
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(", ")}`);
    }
    throw new Error("Invalid environment configuration. Check .env.example for required variables.");
  }

  // Preview isolation guard: block production credentials in non-production environments
  const env = result.data;
  if (env.VERCEL_ENV === "preview" || env.NODE_ENV === "development") {
    if (env.ENABLE_PRODUCTION_CONVEX === "true") {
      throw new Error("BLOCKED: ENABLE_PRODUCTION_CONVEX=true is not permitted in Preview/Development environments.");
    }
    if (env.ENABLE_LIVE_STRIPE === "true") {
      throw new Error("BLOCKED: ENABLE_LIVE_STRIPE=true is not permitted in Preview/Development environments.");
    }
    if (env.ENABLE_LIVE_EMAIL === "true") {
      throw new Error("BLOCKED: ENABLE_LIVE_EMAIL=true is not permitted in Preview/Development environments.");
    }
  }

  return env;
}

export const env = validateEnvironment();
export type { Environment };
