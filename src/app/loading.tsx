export default function ApplicationLoading() {
  return (
    <main
      className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-4 py-16 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <section className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="h-3 w-28 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
        <div className="mt-4 h-8 w-3/4 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <p className="sr-only">Loading the requested workspace…</p>
      </section>
    </main>
  );
}
