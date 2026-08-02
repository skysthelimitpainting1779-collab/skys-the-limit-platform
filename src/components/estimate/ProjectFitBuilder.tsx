"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, Home, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionPressable } from "@/design/motion/Pressable";

type BuyerType = "homeowner" | "commercial" | "public-sector";
type ProjectCategory = "interior" | "exterior" | "maintenance";
type Condition = "minor" | "normal" | "restoration";
type Timing = "immediate" | "30-days" | "planning";

export function ProjectFitBuilder() {
  const [buyerType, setBuyerType] = useState<BuyerType>("homeowner");
  const [category, setCategory] = useState<ProjectCategory>("interior");
  const [condition, setCondition] = useState<Condition>("normal");
  const [timing, setTiming] = useState<Timing>("30-days");

  const getRecommendation = () => {
    if (buyerType === "homeowner") {
      return {
        title: "Recommended Path: Residential Written Scope Review",
        desc: "Ideal fit for an owner-led room-by-room preparation and painting walkthrough.",
        cta: "Lock In Residential Written Scope",
        href: `/estimate?type=residential&category=${category}&condition=${condition}&timing=${timing}`
      };
    } else if (buyerType === "commercial") {
      return {
        title: "Recommended Path: Commercial Facility Walkthrough",
        desc: "Optimal fit for off-hours scheduling, occupant protection, and phased repainting.",
        cta: "Schedule Commercial Facility Review",
        href: `/estimate?type=commercial&category=${category}&condition=${condition}&timing=${timing}`
      };
    } else {
      return {
        title: "Recommended Path: Public-Sector Opportunity Intake",
        desc: "Best fit for municipal scope review, parking lot striping, and maintenance intake.",
        cta: "Submit Public-Sector Scope Request",
        href: `/estimate?type=public-sector&category=${category}&condition=${condition}&timing=${timing}`
      };
    }
  };

  const rec = getRecommendation();

  return (
    <Card className="relative overflow-hidden border border-slate-800 bg-slate-900/90 text-slate-100 backdrop-blur-xl shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="gap-1.5 border-amber-500/30 text-amber-400 bg-amber-500/10 px-3 py-1">
            <Sparkles className="size-3.5" />
            Project Scope Builder
          </Badge>
          <span className="text-xs font-mono text-slate-400">Non-Pricing Scope Review</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-balance mt-2">
          Find Your Project Fit
        </CardTitle>
        <CardDescription className="text-pretty text-slate-400">
          Answer 4 quick project scope questions to determine the exact preparation and walkthrough path for your project.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Buyer Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            1. Property / Buyer Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "homeowner" as const, label: "Homeowner", icon: Home },
              { id: "commercial" as const, label: "Facility / Commercial", icon: Building2 },
              { id: "public-sector" as const, label: "Public / Municipal", icon: Landmark }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBuyerType(item.id)}
                  className={`py-3 px-3 text-xs font-semibold rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                    buyerType === item.id
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold"
                      : "bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Project Category */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            2. Scope Focus
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "interior" as const, label: "Interior Painting" },
              { id: "exterior" as const, label: "Exterior Painting" },
              { id: "maintenance" as const, label: "Striping / Maintenance" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`py-2.5 px-3 text-xs font-medium rounded-xl border transition-all ${
                  category === item.id
                    ? "bg-slate-800 text-amber-400 border-amber-500/50 shadow-sm font-semibold"
                    : "bg-slate-950/80 hover:bg-slate-800 text-slate-400 border-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Current Condition */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            3. Surface Preparation Requirement
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "minor" as const, label: "Standard Prep", desc: "Clean & 2 coats" },
              { id: "normal" as const, label: "Patch & Sand", desc: "Drywall & trim repair" },
              { id: "restoration" as const, label: "Full Restoration", desc: "Scraping, priming, caulk" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCondition(item.id)}
                className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  condition === item.id
                    ? "bg-slate-800 text-amber-400 border-amber-500/50 shadow-sm"
                    : "bg-slate-950/80 hover:bg-slate-800 text-slate-400 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{item.label}</span>
                  {condition === item.id && <CheckCircle2 className="size-3.5 text-amber-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Desired Timing */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            4. Desired Timing
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "immediate" as const, label: "< 2 Weeks" },
              { id: "30-days" as const, label: "Within 30 Days" },
              { id: "planning" as const, label: "Planning Ahead" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTiming(item.id)}
                className={`py-2.5 px-3 text-xs font-medium rounded-xl border transition-all ${
                  timing === item.id
                    ? "bg-slate-800 text-amber-400 border-amber-500/50 shadow-sm font-semibold"
                    : "bg-slate-950/80 hover:bg-slate-800 text-slate-400 border-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Output Box */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-amber-300">{rec.title}</div>
            <p className="text-xs text-slate-300">{rec.desc}</p>
          </div>

          <MotionPressable className="w-full">
            <Link
              href={rec.href}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-amber-400 transition-all w-full"
            >
              {rec.cta}
              <ArrowRight className="size-4" />
            </Link>
          </MotionPressable>

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
            <span>Includes owner-led walkthrough, surface prep breakdown &amp; written scope contract.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
