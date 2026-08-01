import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Landmark, CheckCircle2, FileText } from "lucide-react";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Public Sector & Municipal Painting | Sky's the Limit Painting LLC",
  description: "Municipal and educational painting projects for Twin Cities public buyers. Transparent line-item bids, safety compliance, and documented handoffs.",
  openGraph: {
    title: "Public Sector & Municipal Painting | Sky's the Limit Painting LLC",
    description: "Municipal and educational painting projects for Twin Cities public buyers.",
    url: "https://skysthelimitpaintingllc.com/public-sector",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Public Sector Painting Procurement",
  provider: {
    "@type": "PaintingContractor",
    name: "Sky's the Limit Painting LLC",
  },
  areaServed: "Twin Cities, MN",
};

const publicSectorCapabilities = [
  {
    title: "Municipal & Public Facilities",
    description: "Government buildings, community centers, & public assets",
    content: "Full bid readiness, transparent line-item estimates, and compliance with public agency procurement standards.",
    features: ["Line-item cost breakdown", "Safety-first execution plan", "Complete scope verification"],
  },
  {
    title: "Educational Institutions",
    description: "Schools, universities, & athletic facilities",
    content: "Scheduled summer and break-period painting executions designed around academic calendars and facility safety.",
    features: ["Vetted & trained personnel", "Quality paint systems", "Strict schedule adherence"],
  },
  {
    title: "Documented Compliance",
    description: "Audit trail, safety protocols, & closeout logs",
    content: "Clear closeout documentation, surface preparation records, and formal joint walkthrough sign-offs.",
    features: ["Daily shift reports", "Material safety data sheets", "Walkthrough closeout audit"],
  },
] as const;

export default function PublicSectorPage() {
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
              <Landmark className="size-3.5" />
              Public Sector Division
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Public Sector Procurement &amp; Capability Readiness
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Transparent, line-item bidding and documented execution for municipal, county, and educational painting projects.
            </p>
          </div>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publicSectorCapabilities.map((cap) => (
            <MotionStaggerItem key={cap.title}>
              <Card className="h-full border-border/80 bg-card/60 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-lg flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <Badge variant="secondary" className="w-fit text-[10px] uppercase font-mono">
                    Capability Scope
                  </Badge>
                  <CardTitle className="text-xl font-bold text-foreground">{cap.title}</CardTitle>
                  <CardDescription className="text-xs">{cap.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-muted-foreground">
                  <p className="leading-relaxed">{cap.content}</p>
                  <ul className="space-y-2 border-t border-border/60 pt-3">
                    {cap.features.map((feat) => (
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
                <FileText className="size-5 text-primary" />
                Submitting a public procurement RFP?
              </h3>
              <p className="text-xs text-muted-foreground">
                Request capability documentation and line-item bid specifications.
              </p>
            </div>

            <MotionPressable className="w-full sm:w-auto">
              <Link href="/estimate?segment=public-sector" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto gap-2 shadow-lg" })}>
                Request Public Sector RFP Bid
                <ArrowRight className="size-4" />
              </Link>
            </MotionPressable>
          </div>
        </MotionReveal>
      </div>
    </main>
  );
}
