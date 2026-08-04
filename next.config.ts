import type { NextConfig } from "next";
import { validateEnvironment } from "./src/lib/environment/schema";

if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production") {
  validateEnvironment(process.env);
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
