import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  Home,
  Landmark,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { ProjectCalculator } from "@/components/estimate/ProjectCalculator";

export const metadata: Metadata = {
  title: "Sky's the Limit Painting LLC | Premier Twin Cities Painting Contractors",
  description:
    "Prep-first residential, commercial, and public-sector painting estimates for Twin Cities properties. Transparent pricing, direct owner communication, and documented closeout.",
  openGraph: {
    title: "Sky's the Limit Painting LLC | Premier Twin Cities Painting Contractors",
    description:
      "Prep-first residential, commercial, and public-sector painting estimates for Twin Cities properties.",
    url: "https://skysthelimitpaintingllc.com",
    siteName: "Sky's the Limit Painting LLC",
    locale: "en_US",
    type: "website",
  },
};

// JSON-LD Structured Data for LocalBusiness & PaintingContractor SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "PaintingContractor",
  name: "Sky's the Limit Painting LLC",
  url: "https://skysthelimitpaintingllc.com",
  logo: "https://skysthelimitpaintingllc.com/brand/logo-illustrated-badge.webp",
  description:
    "Prep-first painting estimates for Twin Cities homes, commercial properties, and public assets.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Twin Cities",
    addressRegion: "MN",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 44.9778,
    longitude: -93.265,
  },
  areaServed: ["Minneapolis", "St. Paul", "Twin Cities Metro"],
  priceRange: "$$",
  knowsAbout: [
    "Residential Painting",
    "Commercial Facility Painting",
    "Public Sector Procurement Painting",
    "Surface Preparation & Priming",
  ],
};

const servicePaths = [
  {
    href: "/residential",
    title: "Residential Painting",
    subtitle: "Homeowners & Single-Family Scopes",
    description:
      "Detailed interior and exterior painting with surgical prep, furniture protection, and crisp lines.",
    icon: Home,
    highlights: ["Dust-contained sanding", "Double-coat durability guarantee", "Color consultation"],
  },
  {
    href: "/commercial",
    title: "Commercial & Off-Hours",
    subtitle: "Facilities, Offices & Multi-Tenant",
    description:
      "Flexible off-hours scheduling to eliminate operational downtime for offices and retail spaces.",
    icon: Building2,
    highlights: ["Flexible scheduling", "Low-odor high-durability coatings", "Direct site supervisor"],
  },
  {
    href: "/public-sector",
    title: "Public Sector & Municipal",
    subtitle: "Government & Educational Assets",
    description:
      "Full capability readiness, transparent line-item bidding, and public agency compliance.",
    icon: Landmark,
    highlights: ["Detailed bid documentation", "Safety-first execution", "Timely project closeout"],
  },
] as const;

const trustMetrics = [
  { value: "100%", label: "Prep-First Guarantee", icon: ShieldCheck },
  { value: "24 Hr", label: "Estimate Turnaround", icon: Clock },
  { value: "0", label: "Hidden Extra Fees", icon: FileCheck2 },
  { value: "4.9/5", label: "Client Satisfaction", icon: Star },
];

const processSteps = [
  {
    step: "01",
    title: "Structured Intake",
    description: "Submit your project details in under 2 minutes with zero duplicate friction.",
  },
  {
    step: "02",
    title: "On-Site / Scope Verification",
    description: "We inspect substrate conditions, access, and surface prep requirements.",
  },
  {
    step: "03",
    title: "Transparent Line-Item Quote",
    description: "Receive a clear, fixed-scope estimate breakdown with no vague estimates.",
  },
  {
    step: "04",
    title: "Clean Execution & Handoff",
    description: "Expert application followed by a joint walkthrough closeout audit.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Inject SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative border-b border-border/60 bg-gradient-to-b from-background via-background/95 to-muted/20 px-4 py-16 sm:px-6 lg:px-8 lg:py-28 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <MotionReveal direction="up">
            <div className="flex flex-col gap-6">
              <Badge variant="outline" className="w-fit gap-2 border-primary/30 text-primary bg-primary/5 px-3 py-1 font-medium text-xs">
                <Sparkles className="size-3.5" />
                Owner-Led Twin Cities Painting Contractors
              </Badge>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.1]">
                Careful Prep. <br />
                <span className="text-primary">
                  Flawless Finish.
                </span>{" "}
                <br />
                Documented Handoff.
              </h1>

              <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
                Sky&apos;s the Limit Painting LLC provides prep-first residential, commercial, and public-sector painting. We define the exact scope upfront so your project stays on schedule and budget.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row pt-2">
                <MotionPressable>
                  <Link href="/estimate" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto gap-2 shadow-lg shadow-primary/20" })}>
                    Request Official Estimate
                    <ArrowRight className="size-4" />
                  </Link>
                </MotionPressable>

                <MotionPressable>
                  <Link href="/commercial" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
                    Explore Commercial Scopes
                  </Link>
                </MotionPressable>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border/80">
                {trustMetrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col">
                    <span className="text-2xl font-black text-foreground font-mono">{metric.value}</span>
                    <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>

          {/* Interactive Calculator Card */}
          <MotionReveal direction="up" delay={0.2}>
            <ProjectCalculator />
          </MotionReveal>
        </div>
      </section>

      {/* Service Paths Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-background">
        <div className="mx-auto max-w-6xl">
          <MotionReveal direction="down">
            <div className="mb-12 text-center max-w-3xl mx-auto space-y-3">
              <Badge variant="outline" className="text-xs uppercase tracking-widest text-muted-foreground border-border">
                Tailored Services
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                Choose Your Project Path
              </h2>
              <p className="text-base text-muted-foreground">
                Every path flows into the same structured intake with guaranteed owner oversight and clean handoffs.
              </p>
            </div>
          </MotionReveal>

          <MotionStagger className="grid gap-6 md:grid-cols-3">
            {servicePaths.map(({ href, title, subtitle, description, icon: Icon, highlights }) => (
              <MotionStaggerItem key={href}>
                <Link href={href} className="group focus-visible:outline-none block h-full">
                  <Card className="h-full border-border/80 bg-card/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-xl group-hover:bg-card">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="size-6" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-mono uppercase">
                          Path
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {title}
                        </CardTitle>
                        <span className="text-xs font-medium text-muted-foreground">{subtitle}</span>
                      </div>
                      <CardDescription className="text-xs leading-relaxed">
                        {description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-2">
                      <ul className="space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                        {highlights.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <CheckCircle2 className="size-3.5 text-primary flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center gap-2 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                        Explore Scope Specifications <ArrowRight className="size-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section className="border-y border-border/60 bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <MotionReveal direction="up">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <Badge variant="outline" className="text-xs uppercase tracking-widest text-muted-foreground">
                How We Operate
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                The Prep-First Process
              </h2>
              <p className="text-sm text-muted-foreground">
                Predictable execution from intake to final sign-off walkthrough.
              </p>
            </div>
          </MotionReveal>

          <MotionStagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((item) => (
              <MotionStaggerItem key={item.step}>
                <div className="relative flex flex-col space-y-3 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                  <span className="text-4xl font-black font-mono text-primary/20">{item.step}</span>
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-background">
        <div className="mx-auto max-w-5xl rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          
          <Badge variant="default" className="mx-auto">
            Ready to Start Your Project?
          </Badge>

          <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground">
            Get a Detailed, Fixed-Price Estimate Today
          </h2>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            No guesswork, no surprise charges. Submit your scope details in under 2 minutes and receive your traceable lead reference immediately.
          </p>

          <div className="pt-2 flex justify-center">
            <MotionPressable>
              <Link href="/estimate" className={buttonVariants({ size: "lg", className: "gap-2 shadow-xl shadow-primary/25 px-8 text-base font-bold" })}>
                Start Free Estimate Request
                <ArrowRight className="size-5" />
              </Link>
            </MotionPressable>
          </div>
        </div>
      </section>
    </main>
  );
}
