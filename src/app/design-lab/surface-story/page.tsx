import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ConceptSurfaceStory() {
  return (
    <div className="space-y-24 pb-24 text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 max-w-7xl mx-auto">
        <div className="space-y-8 max-w-4xl">
          <Badge variant="outline" className="border-slate-700 text-slate-300 bg-slate-900 px-3.5 py-1 text-xs">
            <Eye className="size-3.5 mr-1.5 inline text-amber-400" />
            Surface Story — Concept Direction B (Editorial)
          </Badge>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-balance leading-none">
            Material conditions.<br />Documented restoration.
          </h1>

          <p className="text-xl text-slate-300 text-pretty max-w-2xl font-light leading-relaxed">
            An architectural perspective on surface preparation, protective coatings, and durable finishing across the Twin Cities.
          </p>

          <div className="pt-4 flex items-center gap-4">
            <Link
              href="/estimate"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-white transition-all"
            >
              Start Written Scope
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-800">
            <Image
              src="/design-lab/candidates/surface-preparation-closeup.webp"
              alt="Material texture and prep detail"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
            <div className="absolute inset-0 bg-slate-950/40" />
            <div className="absolute bottom-4 left-4 font-mono text-xs text-slate-200">
              FIG 01. SUBSTRATE SANDING &amp; SMOOTHING
            </div>
          </div>
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-800">
            <Image
              src="/design-lab/candidates/interior-living-room.webp"
              alt="Finished interior living room"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
            <div className="absolute inset-0 bg-slate-950/40" />
            <div className="absolute bottom-4 left-4 font-mono text-xs text-slate-200">
              FIG 02. COMPLETED RESIDENTIAL FINISH
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
