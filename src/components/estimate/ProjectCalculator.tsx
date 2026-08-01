"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionPressable } from "@/design/motion/Pressable";

type ProjectType = "residential-int" | "residential-ext" | "commercial";
type PrepLevel = "standard" | "premium";

export function ProjectCalculator() {
  const [projectType, setProjectType] = useState<ProjectType>("residential-int");
  const [sqft, setSqft] = useState<number>(1500);
  const [prepLevel, setPrepLevel] = useState<PrepLevel>("standard");

  const calculateEstimate = () => {
    let rate = 2.5; // base rate per sqft
    if (projectType === "residential-ext") rate = 3.2;
    if (projectType === "commercial") rate = 2.8;
    if (prepLevel === "premium") rate *= 1.3;

    const baseCost = sqft * rate;
    const minCost = Math.round(baseCost * 0.85);
    const maxCost = Math.round(baseCost * 1.15);

    return { minCost, maxCost };
  };

  const { minCost, maxCost } = calculateEstimate();

  return (
    <Card className="relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-xl shadow-xl transition-all hover:border-primary/40">
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary bg-primary/5 px-3 py-1">
            <Sparkles className="size-3.5" />
            Instant Estimator
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">Interactive Cost Preview</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight mt-2">
          Project Cost Calculator
        </CardTitle>
        <CardDescription>
          Get an immediate estimated budget range based on surface area and preparation level.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1. Select Project Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "residential-int" as const, label: "Home Interior" },
              { id: "residential-ext" as const, label: "Home Exterior" },
              { id: "commercial" as const, label: "Commercial Facility" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setProjectType(item.id)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                  projectType === item.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/80 hover:bg-muted text-foreground border-border"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Square Footage Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">
              2. Estimated Square Footage
            </span>
            <span className="font-mono font-bold text-sm text-foreground bg-muted/60 px-2.5 py-0.5 rounded border border-border">
              {sqft.toLocaleString()} sq ft
            </span>
          </div>
          <input
            type="range"
            min={400}
            max={10000}
            step={100}
            value={sqft}
            onChange={(e) => setSqft(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>400 sq ft</span>
            <span>5,000 sq ft</span>
            <span>10,000+ sq ft</span>
          </div>
        </div>

        {/* Prep Level Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            3. Surface Preparation Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "standard" as const, title: "Standard Prep", desc: "Washing, minor patching, 2 coats" },
              { id: "premium" as const, title: "Restoration Prep", desc: "Full sanding, priming, detailed caulk & trim" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPrepLevel(item.id)}
                className={`p-3 text-left rounded-lg border transition-all ${
                  prepLevel === item.id
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-background/80 hover:bg-muted text-muted-foreground border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{item.title}</span>
                  {prepLevel === item.id && <CheckCircle2 className="size-3.5 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Price Display */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Estimated Price Range
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono mt-0.5">
              ${minCost.toLocaleString()} – ${maxCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400 inline" />
              Includes labor, premium prep, materials &amp; final walkthrough guarantee.
            </p>
          </div>

          <MotionPressable className="w-full sm:w-auto">
            <Link
              href={`/estimate?sqft=${sqft}&type=${projectType}&prep=${prepLevel}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all w-full sm:w-auto whitespace-nowrap"
            >
              Lock In Official Quote
              <ArrowRight className="size-4" />
            </Link>
          </MotionPressable>
        </div>
      </CardContent>
    </Card>
  );
}
