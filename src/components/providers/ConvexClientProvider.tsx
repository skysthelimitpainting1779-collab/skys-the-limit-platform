"use client";

import {
  AuthKitProvider,
  useAccessToken,
  useAuth,
} from "@workos-inc/authkit-nextjs/components";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import {
  type ReactNode,
  useCallback,
  useState,
} from "react";

function isConfiguredConvexUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.hostname.includes("placeholder") &&
      !url.hostname.includes("your-deployment")
    );
  } catch {
    return false;
  }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <AuthKitProvider>
      {isConfiguredConvexUrl(convexUrl) ? (
        <ConfiguredConvexProvider convexUrl={convexUrl}>
          {children}
        </ConfiguredConvexProvider>
      ) : (
        children
      )}
    </AuthKitProvider>
  );
}

function ConfiguredConvexProvider({
  children,
  convexUrl,
}: {
  children: ReactNode;
  convexUrl: string;
}) {
  const [client] = useState(() => new ConvexReactClient(convexUrl));

  return (
    <ConvexProviderWithAuth client={client} useAuth={useAuthFromAuthKit}>
      {children}
    </ConvexProviderWithAuth>
  );
}

function useAuthFromAuthKit() {
  const { user, loading: isLoading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();

  const fetchAccessToken = useCallback(
    async ({
      forceRefreshToken,
    }: {
      forceRefreshToken?: boolean;
    } = {}): Promise<string | null> => {
      if (!user) return null;

      try {
        if (forceRefreshToken) {
          return (await refresh()) ?? null;
        }
        return (await getAccessToken()) ?? null;
      } catch {
        console.error("[AuthKit] Convex access-token retrieval failed.");
        return null;
      }
    },
    [getAccessToken, refresh, user],
  );

  return {
    isLoading,
    isAuthenticated: Boolean(user),
    fetchAccessToken,
  };
}
