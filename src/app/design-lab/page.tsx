import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Layers, Eye, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DesignLabIndex() {
  const concepts = [
    {
      slug: "proof-in-every-layer",
      title: "Concept A: Proof in Every Layer",
      badge: "Recommended",
      badgeVariant: "default" as const,
      description: "Preparation-to-finish narrative, before/after interactive slider, evidence annotations, and a vertical proof line.",
      icon: Layers,
      highlights: [
        "Preparation-detail closeup framing",
        "Interactive before/after bedroom transformation",
        "Restrained Sky's orange proof-line accent",
        "Highest balance of conversion, truth, and visual craft"
      ]
    },
    {
      slug: "surface-story",
      title: "Concept B: Surface Story",
      badge: "Editorial",
      badgeVariant: "outline" as const,
      description: "Cinematic, texture-focused editorial composition highlighting material conditions and restoration detail.",
      icon: Eye,
      highlights: [
        "Architectural studio aesthetic",
        "Large-format material focus",
        "Deep contrast plaster-to-mineral palette",
        "Documentary-style section transitions"
      ]
    },
    {
      slug: "owners-standard",
      title: "Concept C: Owner's Standard",
      badge: "Accountability",
      badgeVariant: "secondary" as const,
      description: "Direct owner accountability, equipment/process visual language, written-scope focus, and documented handoff.",
      icon: Award,
      highlights: [
        "Anthony Briseno owner-led commitment",
        "Written scope & closeout checklist motifs",
        "Field equipment & jobsite professionalism focus",
        "Direct Twin Cities community relevance"
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
      <div className="space-y-4 max-w-3xl">
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
          Signature Design & Conversion V2
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-balance">
          Design Lab Concepts
        </h1>
        <p className="text-lg text-slate-300 text-pretty">
          Review the three high-fidelity creative directions built with candidate assets under protected Vercel Preview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {concepts.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.slug} className="bg-slate-900/80 border-slate-800 flex flex-col justify-between hover:border-amber-500/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant={c.badgeVariant}>{c.badge}</Badge>
                </div>
                <CardTitle className="text-xl text-slate-100">{c.title}</CardTitle>
                <CardDescription className="text-slate-400 text-sm">{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <ul className="space-y-2 text-xs text-slate-300">
                  {c.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ShieldCheck className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/design-lab/${c.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition-all w-full"
                >
                  Preview Concept
                  <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
