import type { ReactNode } from "react";
import { AuthenticatedPortal } from "@/components/portal/AuthenticatedPortal";

export const dynamic = "force-dynamic";

export default function OperationsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedPortal returnTo="/operations">{children}</AuthenticatedPortal>
  );
}
