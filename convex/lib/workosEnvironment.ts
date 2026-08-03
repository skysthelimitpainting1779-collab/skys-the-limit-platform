export type RequiredWorkOSValue =
  | "WORKOS_CLIENT_ID"
  | "WORKOS_API_KEY"
  | "WORKOS_WEBHOOK_SECRET"
  | "WORKOS_ACTION_SECRET";

export function isConfiguredEnvironmentValue(value: string | undefined) {
  if (!value?.trim()) return false;
  const normalized = value.trim().toLowerCase();
  return ![
    "replace_me",
    "replace_with_",
    "unconfigured",
    "placeholder",
    "your-deployment",
    "generate_",
  ].some((marker) => normalized.includes(marker));
}

export function requireConfiguredWorkOSValue(
  name: RequiredWorkOSValue,
): string {
  const value = process.env[name];
  if (!isConfiguredEnvironmentValue(value)) {
    throw new Error(`${name} must be configured for Convex AuthKit`);
  }
  return value!;
}
