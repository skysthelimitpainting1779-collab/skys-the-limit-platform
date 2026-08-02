import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
      // AuthKit imports the extensionless Next.js cache entry. Node-based
      // Vitest needs the concrete package file, while production Next.js keeps
      // using its normal package export resolution.
      "next/cache": path.resolve(__dirname, "./node_modules/next/cache.js"),
    },
  },
});
