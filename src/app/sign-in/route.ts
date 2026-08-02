import { getPlatformSignInUrl } from "@/lib/auth/workos";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") || "/operations";
  const url = await getPlatformSignInUrl(returnTo);
  return redirect(url);
}
