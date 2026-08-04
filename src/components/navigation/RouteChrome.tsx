"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NavigationFooter } from "./Footer";
import { NavigationHeader } from "./Header";

const PORTAL_PREFIXES = ["/operations", "/crew", "/customer"];

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPortal = PORTAL_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isPortal) return children;

  return (
    <>
      <NavigationHeader />
      <div className="flex-1">{children}</div>
      <NavigationFooter />
    </>
  );
}
