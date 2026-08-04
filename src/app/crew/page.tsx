import type { Metadata } from "next";
import { CrewDashboard } from "@/components/crew/CrewDashboard";

export const metadata: Metadata = {
  title: "Crew Workspace | Sky's the Limit Painting",
  description: "Field crew dispatch, project daily logs, safety checklists, and jobsite specs.",
};

export default function CrewPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-foreground sm:text-4xl">
          Today&apos;s field work
        </h1>
        <p className="mt-3 max-w-[70ch] text-base leading-7 text-muted-foreground">
          Open an assigned job, complete its tasks and prep checks, record the
          day&apos;s update, and attach authorized evidence from the jobsite.
        </p>
      </header>

      <CrewDashboard />
    </main>
  );
}

