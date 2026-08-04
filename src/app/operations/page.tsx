import type { Metadata } from "next";
import { OperationsDashboard } from "@/components/operations/OperationsDashboard";

export const metadata: Metadata = {
  title: "Operations Control Center | Sky's the Limit Painting",
  description: "Central operations dashboard for schedule management, estimating pipeline, and crew assignment.",
};

export default function OperationsPage() {
  return (
    <main className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl">
          Operations command center
        </h1>
        <p className="mt-3 max-w-[70ch] text-base leading-7 text-muted-foreground">
          Work the exceptions first, then move leads, estimates, jobs,
          customer records, proof, and publication through one accountable
          system.
        </p>
      </header>

      <OperationsDashboard />
    </main>
  );
}

