import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { EstimateForm } from "./EstimateForm";

export const metadata: Metadata = {
  title: "Request an Estimate",
  description:
    "Share the property, scope, and timing for a residential, commercial, or public-sector painting project.",
};

export default function EstimatePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Badge variant="brand" className="w-fit">
            Twin Cities estimate intake
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Start with a clear project scope
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Tell us what needs painting, where the project is located, and when you hope to begin. We will review the details and follow up about the next appropriate step.
          </p>
        </header>

        <EstimateForm />

        <section className="grid gap-4 rounded-xl border bg-card p-6 text-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold">1. Scope review</p>
            <p className="mt-1 text-muted-foreground">We review the submitted property and project details.</p>
          </div>
          <div>
            <p className="font-semibold">2. Follow-up</p>
            <p className="mt-1 text-muted-foreground">We contact you if measurements, photos, or a site visit are needed.</p>
          </div>
          <div>
            <p className="font-semibold">3. Written estimate</p>
            <p className="mt-1 text-muted-foreground">The final scope and price are documented before work is scheduled.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
