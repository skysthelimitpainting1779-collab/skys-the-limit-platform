import type { NextConfig } from "next";
import { validateEnvironment } from "./src/lib/environment/schema";

if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production") {
  validateEnvironment(process.env);
}

const nextConfig: NextConfig = {
  env: {
    // `convex deploy --cmd` supplies NEXT_PUBLIC_CONVEX_URL for this build.
    // Freeze the same non-secret URL for server routes so stale Vercel runtime
    // variables cannot point them at a different deployment.
    CONVEX_DEPLOYMENT_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
};

export default nextConfig;
