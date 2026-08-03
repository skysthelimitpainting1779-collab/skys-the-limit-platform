"use client";

import {
  AuthKitProvider,
  useAccessToken,
  useAuth,
} from "@workos-inc/authkit-nextjs/components";
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useConvexAuth,
  useMutation,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  type ReactNode,
  useCallback,
  useEffect,
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
      <ProvisionAuthenticatedUser />
      {children}
    </ConvexProviderWithAuth>
  );
}

/** Bind the JWT to a webhook-verified WorkOS profile; Convex owns grants. */
function ProvisionAuthenticatedUser() {
  const { isAuthenticated } = useConvexAuth();
  const storeAuthenticatedUser = useMutation(api.users.store);

  useEffect(() => {
    if (!isAuthenticated) return;

    void storeAuthenticatedUser({}).catch(() => {
      console.error("[AuthKit] Convex identity provisioning failed.");
    });
  }, [isAuthenticated, storeAuthenticatedUser]);

  return null;
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
