import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

const ALLOWED_RETURN_PATHS = new Set(["/operations", "/crew", "/customer"]);

export async function GET(request: Request) {
  const requestedReturnTo = new URL(request.url).searchParams.get("returnTo");
  const safeReturnTo =
    requestedReturnTo && ALLOWED_RETURN_PATHS.has(requestedReturnTo)
      ? requestedReturnTo
      : "/operations";
  const organizationId = process.env.WORKOS_ORGANIZATION_ID;

  if (!organizationId) {
    throw new Error("WORKOS_ORGANIZATION_ID must be configured");
  }

  redirect(
    await getSignInUrl({
      returnTo: safeReturnTo,
      organizationId,
    }),
  );
}
