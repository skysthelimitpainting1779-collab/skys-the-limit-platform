import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { BeforeAfterSlider } from "@/components/proof/BeforeAfterSlider";
import { Badge } from "@/components/ui/badge";

export default function ConceptProofInEveryLayer() {
  return (
    <div className="space-y-24 pb-24 text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 px-3.5 py-1 text-xs">
              <Sparkles className="size-3.5 mr-1.5 inline" />
              Proof In Every Layer — Concept Direction A
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-balance leading-none">
              Prep-first painting for Twin Cities homes and facilities.
            </h1>

            <p className="text-lg text-slate-300 text-pretty max-w-2xl leading-relaxed">
              Know what will be prepared, protected, painted, and completed before work starts. Owner Anthony Briseno delivers written scopes and documented closeouts across the metro.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/estimate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
              >
                Get a Written Scope
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#transformation"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all"
              >
                See the Work Behind the Finish
              </a>
            </div>

            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs font-mono text-slate-400">
              <div>
                <span className="block font-bold text-slate-200">Owner-Led</span>
                <span>Direct communication</span>
              </div>
              <div>
                <span className="block font-bold text-slate-200">Prep-First</span>
                <span>Substrate restoration</span>
              </div>
              <div>
                <span className="block font-bold text-slate-200">Written Scope</span>
                <span>Documented closeout</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <Image
                src="/design-lab/candidates/exterior-action-with-logo.webp"
                alt="Sky's the Limit exterior crew in action"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 500px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
                <div className="text-xs font-mono text-amber-400 mb-1">01 / SUBSTRATE PROTECTION</div>
                <div className="text-sm font-bold text-slate-100">Exterior Surface Restoration</div>
                <div className="text-xs text-slate-400 mt-0.5">Twin Cities Metro residential project</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Interactive Transformation Section */}
      <section id="transformation" className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
            Interactive Proof
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
            The Difference Preparation Makes
          </h2>
          <p className="text-slate-400 text-sm text-pretty">
            Inspect the step-by-step restoration process from raw wall condition to immaculate finish.
          </p>
        </div>

        <BeforeAfterSlider
          beforeImage="/design-lab/candidates/surface-preparation-closeup.webp"
          afterImage="/design-lab/candidates/interior-bedroom-before-after.webp"
          beforeLabel="Stage 1: Prep & Patching"
          afterLabel="Stage 2: Finished Application"
        />
      </section>

      {/* Numbered Work Layers */}
      <section className="max-w-6xl mx-auto px-6 space-y-12">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Standard Operating Method</span>
          <h2 className="text-3xl font-extrabold tracking-tight">The 5 Work Layers of Every Project</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { num: "01", title: "Protection", desc: "Floors, furniture, hardware, and surfaces masked with heavy drop cloths and plastic." },
            { num: "02", title: "Prep & Sanding", desc: "Scraping loose paint, patching drywall holes, sanding smooth, and sealing joints." },
            { num: "03", title: "Primer Coat", desc: "High-adhesion stain-blocking primer applied to all raw or repaired areas." },
            { num: "04", title: "Finish Coats", desc: "Two coats of premium commercial coating applied with precise cut-in lines." },
            { num: "05", title: "Closeout Walkthrough", desc: "Joint owner inspection, detail touch-ups, and final written completion sign-off." }
          ].map((layer) => (
            <div key={layer.num} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
              <span className="text-2xl font-black font-mono text-amber-400">{layer.num}</span>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-100">{layer.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{layer.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Primary Pathway Links */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Residential Homes", desc: "Interiors, exteriors, and cabinet refinishing with zero mess left behind.", href: "/residential", img: "/design-lab/candidates/interior-kitchen.webp" },
          { title: "Commercial Facilities", desc: "Common areas, offices, and property management maintenance repainting.", href: "/commercial", img: "/design-lab/candidates/commercial-finished.webp" },
          { title: "Public Sector & Infrastructure", desc: "Parking lot striping, light pole painting, and municipal intake.", href: "/public-sector", img: "/design-lab/candidates/parking-lot-striping.webp" }
        ].map((path, i) => (
          <div key={i} className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col justify-between">
            <div className="relative aspect-[16/10] w-full">
              <Image src={path.img} alt={path.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 400px" />
              <div className="absolute inset-0 bg-slate-950/60" />
            </div>
            <div className="p-6 space-y-3">
              <h3 className="text-xl font-bold text-slate-100">{path.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{path.desc}</p>
              <Link href={path.href} className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300">
                Explore Pathway <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
