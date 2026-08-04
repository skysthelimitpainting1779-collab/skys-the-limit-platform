import type { ReactNode } from "react";
import { AuthenticatedPortal } from "@/components/portal/AuthenticatedPortal";

export const dynamic = "force-dynamic";

export default function CrewLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedPortal returnTo="/crew">{children}</AuthenticatedPortal>;
}
