import { redirect } from "next/navigation";
import { signOut } from "@workos-inc/authkit-nextjs";

export async function GET() {
  const isWorkOSConfigured = Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      !process.env.WORKOS_API_KEY.includes("REPLACE_ME")
  );

  if (isWorkOSConfigured) {
    try {
      await signOut();
    } catch (err) {
      console.warn("[WorkOS] Sign out failed:", err);
    }
  }

  return redirect("/");
}
