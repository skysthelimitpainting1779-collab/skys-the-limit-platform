import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { CrewDashboard } from "@/components/crew/CrewDashboard";

export const metadata: Metadata = {
  title: "Crew Workspace | Sky's the Limit Painting",
  description: "Field crew dispatch, project daily logs, safety checklists, and jobsite specs.",
};

export default function CrewPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="brand">Crew Workspace</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Field Execution & Daily Operations
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Jobsite schedules, safety protocols, surface prep verification, and daily log submission.
            </p>
          </div>
        </MotionReveal>

        <CrewDashboard />
      </div>
    </div>
  );
}
