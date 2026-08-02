import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ConceptOwnersStandard() {
  return (
    <div className="space-y-24 pb-24 text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3.5 py-1 text-xs">
              <Award className="size-3.5 mr-1.5 inline text-amber-400" />
              Owner&apos;s Standard — Concept Direction C (Accountability)
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-balance leading-none">
              Direct Owner Accountability.<br />Written Scopes. Zero Surprises.
            </h1>

            <p className="text-lg text-slate-300 text-pretty max-w-2xl leading-relaxed">
              Every job estimated and overseen directly by Anthony Briseno. Serving Inver Grove Heights, St. Paul, Minneapolis, and the Twin Cities metro.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/estimate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-black hover:bg-amber-400 transition-all"
              >
                Request Written Scope
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <Image
                src="/design-lab/candidates/branded-equipment.webp"
                alt="Sky's the Limit branded equipment and truck"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 500px"
              />
              <div className="absolute inset-0 bg-slate-950/40" />
              <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-slate-950/80 backdrop-blur-md text-xs font-mono">
                OWNER FIELD EQUIPMENT &amp; JOBSITE STANDARDS
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
