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
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";

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
        <ConvexConfigurationError />
      )}
    </AuthKitProvider>
  );
}

export function ConvexConfigurationError() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-4 py-16 text-foreground"
      data-testid="convex-configuration-error"
    >
      <section className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">Workspace unavailable</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          The application data connection is not configured
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
          This environment is missing a valid Convex endpoint. No operational
          data has been loaded or changed. An administrator must configure the
          environment before this workspace can be used.
        </p>
      </section>
    </main>
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

function ProvisionAuthenticatedUser() {
  const { isAuthenticated } = useConvexAuth();
  const bindAuthenticatedUser = useMutation(api.users.store);
  const [failedRetryVersion, setFailedRetryVersion] = useState<number | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const bind = async (attempt: number) => {
      try {
        await bindAuthenticatedUser({});
        if (!cancelled) setFailedRetryVersion(null);
      } catch {
        if (cancelled) return;
        if (attempt >= 4) {
          console.error("[AuthKit] Convex identity binding failed.");
          setFailedRetryVersion(retryVersion);
          return;
        }
        retryTimer = setTimeout(
          () => void bind(attempt + 1),
          500 * 2 ** attempt,
        );
      }
    };
    void bind(0);
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [bindAuthenticatedUser, isAuthenticated, retryVersion]);

  if (!isAuthenticated || failedRetryVersion !== retryVersion) return null;
  return (
    <section
      role="alert"
      className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground"
    >
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-3">
        <p>
          Secure account setup did not finish. No protected records were loaded.
        </p>
        <button
          type="button"
          onClick={() => setRetryVersion((version) => version + 1)}
          className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-3 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Retry secure setup
        </button>
      </div>
    </section>
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
        return forceRefreshToken
          ? ((await refresh()) ?? null)
          : ((await getAccessToken()) ?? null);
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
