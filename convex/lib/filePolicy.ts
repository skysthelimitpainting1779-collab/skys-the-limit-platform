import { v } from "convex/values";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const accessLevelValidator = v.union(
  v.literal("public"),
  v.literal("internal"),
  v.literal("restricted"),
);
