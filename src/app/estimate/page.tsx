import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { EstimateForm } from "./EstimateForm";

export const metadata: Metadata = {
  title: "Request an Estimate | Sky's the Limit Painting",
  description: "Get a detailed, transparent painting estimate for residential, commercial, or public projects.",
};

export default function EstimatePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4 text-center sm:text-left">
            <Badge variant="brand">Free Consultation & Quote</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Request Your Detailed Painting Estimate
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              No hidden fees, no high-pressure sales. Clear scope of work and prep specifications tailored to your project.
            </p>
          </div>
        </MotionReveal>

        <MotionReveal direction="up" delay={0.1}>
          <EstimateForm />
        </MotionReveal>
      </div>
    </div>
  );
}

