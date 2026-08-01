"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

const FALLBACK_CONVEX_URL = "https://sandbox-placeholder.convex.cloud";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const client = useMemo(() => {
    const url = convexUrl || FALLBACK_CONVEX_URL;
    return new ConvexReactClient(url);
  }, [convexUrl]);

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
