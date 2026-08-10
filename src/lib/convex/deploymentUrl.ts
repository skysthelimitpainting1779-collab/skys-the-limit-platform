/**
 * Returns the Convex URL frozen into the Next build by `convex deploy --cmd`.
 * Runtime Vercel variables are intentionally ignored because they can outlive
 * a branch-specific Convex Preview deployment.
 */
export function resolveConvexDeploymentUrl(
  url = process.env.CONVEX_DEPLOYMENT_URL,
) {
  const isLocal =
    url?.startsWith("http://localhost") ||
    url?.startsWith("http://127.0.0.1");
  const isCloud =
    url?.startsWith("https://") && !url.includes("your-deployment");

  if (!url || (!isLocal && !isCloud)) {
    throw new Error("CONVEX_NOT_CONFIGURED");
  }

  return url;
}
