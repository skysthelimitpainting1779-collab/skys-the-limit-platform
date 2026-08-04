import type { ReactNode } from "react";
import { AuthenticatedPortal } from "@/components/portal/AuthenticatedPortal";

export const dynamic = "force-dynamic";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedPortal returnTo="/customer">{children}</AuthenticatedPortal>
  );
}
