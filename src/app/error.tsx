"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Application] A protected route failed safely.", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-bold text-destructive">Workspace interrupted</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Protected records could not be loaded
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
          The request failed closed. No unauthorized fallback data was shown and
          no action should be assumed complete.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Return to the public site
          </Link>
        </div>
      </section>
    </main>
  );
}
