import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { OperationsDashboard } from "@/components/operations/OperationsDashboard";

export const metadata: Metadata = {
  title: "Operations Control Center | Sky's the Limit Painting",
  description: "Central operations dashboard for schedule management, estimating pipeline, and crew assignment.",
};

export default function OperationsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="brand">Operations Control Center</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Platform Operations Management
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              High-level overview of active jobs, estimating pipeline, material logistics, and crew utilization.
            </p>
          </div>
        </MotionReveal>

        <OperationsDashboard />
      </div>
    </div>
  );
}
