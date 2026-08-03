import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { OperationsDashboard } from "@/components/operations/OperationsDashboard";
import type { Id } from "@convex/_generated/dataModel";

export const metadata: Metadata = {
  title: "Operations Control Center | Sky's the Limit Painting",
  description: "Central operations dashboard for schedule management, estimating pipeline, and crew assignment.",
};

export default function OperationsPage() {
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID as
    | Id<"organizations">
    | undefined;
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="default">Operations Control Center</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Platform Operations Management
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              High-level overview of active jobs, estimating pipeline, material logistics, and crew utilization.
            </p>
          </div>
        </MotionReveal>

        <OperationsDashboard orgId={orgId} />
      </div>
    </div>
  );
}

