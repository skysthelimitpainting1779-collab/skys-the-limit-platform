import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

const ALLOWED_RETURN_PATHS = new Set(["/operations", "/crew", "/customer"]);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const safeReturnTo =
    returnTo && ALLOWED_RETURN_PATHS.has(returnTo) ? returnTo : "/operations";
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
