import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Home, ShieldCheck } from "lucide-react";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Residential Painting Services | Sky's the Limit Painting LLC",
  description: "Interior and exterior residential painting for Twin Cities homeowners. Prep-first craftsmanship, dust containment, and clean handoffs.",
  openGraph: {
    title: "Residential Painting Services | Sky's the Limit Painting LLC",
    description: "Interior and exterior residential painting for Twin Cities homeowners.",
    url: "https://skysthelimitpaintingllc.com/residential",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Residential Painting",
  provider: {
    "@type": "PaintingContractor",
    name: "Sky's the Limit Painting LLC",
  },
  areaServed: "Twin Cities, MN",
};

const residentialServices = [
  {
    title: "Interior Painting & Refinishing",
    description: "Walls, ceilings, trim, & custom cabinetry",
    content: "Thorough surface prep, dust isolation, quality premium paints, and crisp lines throughout living spaces.",
    features: ["Furniture & floor protection", "Minor drywall repair", "Low-odor finishes"],
  },
  {
    title: "Exterior Weatherproofing",
    description: "Siding, fascia, trim, & exterior decks",
    content: "Pressure washing, scraping, priming, sealant application, and high-durability topcoats engineered for Minnesota weather.",
    features: ["Substrate moisture testing", "Full primer encapsulation", "Multi-year durability"],
  },
  {
    title: "Cabinetry Transformation",
    description: "Kitchen & bathroom woodwork enamel",
    content: "Factory-smooth spray and brush enamel finishes that refresh kitchen spaces at a fraction of replacement cost.",
    features: ["Off-site door spraying", "Hardened enamel topcoat", "Hardware re-assembly"],
  },
] as const;

export default function ResidentialPage() {
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
              <Home className="size-3.5" />
              Residential Division
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Transforming Twin Cities Homes with Prep-First Precision
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              From interior detail refinishing to full exterior weatherproofing, our owner-led teams deliver lasting beauty with clear scope documentation.
            </p>
          </div>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {residentialServices.map((service) => (
            <MotionStaggerItem key={service.title}>
              <Card className="h-full border-border/80 bg-card/60 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-lg flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <Badge variant="secondary" className="w-fit text-[10px] uppercase font-mono">
                    Service Scope
                  </Badge>
                  <CardTitle className="text-xl font-bold text-foreground">{service.title}</CardTitle>
                  <CardDescription className="text-xs">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-muted-foreground">
                  <p className="leading-relaxed">{service.content}</p>
                  <ul className="space-y-2 border-t border-border/60 pt-3">
                    {service.features.map((feat) => (
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
                <ShieldCheck className="size-5 text-primary" />
                Ready to upgrade your home?
              </h3>
              <p className="text-xs text-muted-foreground">
                Get a fixed-price written estimate with complete surface prep specifications.
              </p>
            </div>

            <MotionPressable className="w-full sm:w-auto">
              <Link href="/estimate?segment=residential" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto gap-2 shadow-lg" })}>
                Request Residential Estimate
                <ArrowRight className="size-4" />
              </Link>
            </MotionPressable>
          </div>
        </MotionReveal>
      </div>
    </main>
  );
}
