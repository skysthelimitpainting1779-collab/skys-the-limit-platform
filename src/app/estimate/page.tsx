import type { Metadata } from "next";
import { ShieldCheck, Sparkles, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EstimateForm } from "./EstimateForm";
import { MotionReveal } from "@/design/motion/Reveal";

export const metadata: Metadata = {
  title: "Request a Painting Estimate | Sky's the Limit Painting LLC",
  description:
    "Get an accurate, fixed-price painting estimate for Twin Cities residential, commercial, or public-sector properties. Idempotent submission & 24-hour turnaround.",
  openGraph: {
    title: "Request a Painting Estimate | Sky's the Limit Painting LLC",
    description:
      "Get an accurate, fixed-price painting estimate for Twin Cities properties.",
    url: "https://skysthelimitpaintingllc.com/estimate",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Painting Estimate",
  provider: {
    "@type": "PaintingContractor",
    name: "Sky's the Limit Painting LLC",
  },
  areaServed: "Twin Cities, MN",
  termsOfService: "https://skysthelimitpaintingllc.com/terms",
};

export default function EstimatePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 px-4 py-12 sm:px-6 lg:px-8">
      {/* Inject SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <MotionReveal direction="down">
          <header className="flex flex-col gap-4 text-center items-center max-w-2xl mx-auto">
            <Badge variant="outline" className="w-fit gap-1.5 border-primary/30 text-primary bg-primary/5 px-3 py-1">
              <Sparkles className="size-3.5" />
              Twin Cities Estimate Intake
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
              Start with a Clear Project Scope
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Tell us about your property, scope, and target timeframe. You will receive an immediate reference receipt and a guaranteed follow-up within 24 hours.
            </p>

            {/* Quick Trust Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                No Obligation
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                24-Hour Review
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-4 text-amber-600 dark:text-amber-400" />
                Data Protected
              </span>
            </div>
          </header>
        </MotionReveal>

        <MotionReveal direction="up" delay={0.15}>
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl backdrop-blur-sm">
            <EstimateForm />
          </div>
        </MotionReveal>

        <MotionReveal direction="up" delay={0.25}>
          <section className="grid gap-6 rounded-2xl border border-border/80 bg-card/60 p-6 text-sm sm:grid-cols-3 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-mono">1</span>
                Scope Review
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our estimators evaluate submitted surface area, access constraints, and substrate condition.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-mono">2</span>
                Verification &amp; Walkthrough
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If needed, we arrange an on-site or digital walkthrough to confirm measurements.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-mono">3</span>
                Fixed Written Scope
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You receive a transparent, line-item proposal before any painting work is scheduled.
              </p>
            </div>
          </section>
        </MotionReveal>
      </div>
    </main>
  );
}
