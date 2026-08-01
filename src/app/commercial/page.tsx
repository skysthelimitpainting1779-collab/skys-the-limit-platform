import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Clock } from "lucide-react";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Commercial Painting Services | Sky's the Limit Painting LLC",
  description: "Commercial facility, office, and multi-tenant painting with flexible off-hours scheduling for Twin Cities businesses.",
  openGraph: {
    title: "Commercial Painting Services | Sky's the Limit Painting LLC",
    description: "Commercial facility, office, and multi-tenant painting for Twin Cities businesses.",
    url: "https://skysthelimitpaintingllc.com/commercial",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Commercial Painting",
  provider: {
    "@type": "PaintingContractor",
    name: "Sky's the Limit Painting LLC",
  },
  areaServed: "Twin Cities, MN",
};

const commercialScopes = [
  {
    title: "Office & Retail Spaces",
    description: "Tenant buildouts, common areas, & retail facades",
    content: "Durable wall coatings, accent branding, and clean transitions designed for high-foot-traffic commercial environments.",
    features: ["Durable coating options", "Dedicated site supervisor", "Daily progress logs"],
  },
  {
    title: "Flexible Scheduling",
    description: "Off-hours, evening, & weekend operations",
    content: "Avoid operational downtime by scheduling crew shifts outside your business hours with full facility security compliance.",
    features: ["Zero operational disruption", "Clean overnight turnover", "Insured & bonded crews"],
  },
  {
    title: "Industrial & Warehouse Scopes",
    description: "High-performance coatings & structural steel",
    content: "Heavy-duty epoxy floor systems, safety line markings, and metal building exterior coatings.",
    features: ["Surface abrasion resistance", "OSHA safety compliance", "Documented surface prep"],
  },
] as const;

export default function CommercialPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-16 px-4 sm:px-6 lg:px-8">
      {/* Inject SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto space-y-12">
        <MotionReveal direction="down">
          <div className="space-y-4 max-w-3xl">
            <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary bg-primary/5 px-3 py-1 text-xs">
              <Building2 className="size-3.5" />
              Commercial Division
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Commercial Facilities &amp; Off-Hours Execution
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Professional crew deployment with flexible scheduling, detailed safety compliance, and direct owner management.
            </p>
          </div>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commercialScopes.map((scope) => (
            <MotionStaggerItem key={scope.title}>
              <Card className="h-full border-border/80 bg-card/60 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-lg flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <Badge variant="secondary" className="w-fit text-[10px] uppercase font-mono">
                    Commercial Scope
                  </Badge>
                  <CardTitle className="text-xl font-bold text-foreground">{scope.title}</CardTitle>
                  <CardDescription className="text-xs">{scope.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-muted-foreground">
                  <p className="leading-relaxed">{scope.content}</p>
                  <ul className="space-y-2 border-t border-border/60 pt-3">
                    {scope.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-foreground font-medium">
                        <CheckCircle2 className="size-3.5 text-primary flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        <MotionReveal direction="up" delay={0.2}>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2 justify-center sm:justify-start">
                <Clock className="size-5 text-primary" />
                Need off-hours commercial painting?
              </h3>
              <p className="text-xs text-muted-foreground">
                Get a customized commercial proposal tailored to your operational schedule.
              </p>
            </div>

            <MotionPressable className="w-full sm:w-auto">
              <Link href="/estimate?segment=commercial" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto gap-2 shadow-lg" })}>
                Request Commercial Estimate
                <ArrowRight className="size-4" />
              </Link>
            </MotionPressable>
          </div>
        </MotionReveal>
      </div>
    </main>
  );
}
