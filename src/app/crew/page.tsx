import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Crew Workspace | Sky's the Limit Painting",
  description: "Field crew dispatch, project daily logs, safety checklists, and jobsite specs.",
};

export default function CrewPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="brand">Crew Workspace</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Field Execution & Daily Operations
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Jobsite schedules, safety protocols, surface prep verification, and daily log submission.
            </p>
          </div>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Daily Schedule</CardTitle>
                <CardDescription>Assigned jobsites & crew dispatch</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Check-in to assigned site, view client special instructions, and confirm site lead contacts.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Prep Checklist</CardTitle>
                <CardDescription>Surface preparation audit</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Mandatory prep verification (masking, scraping, priming, moisture test) prior to topcoat application.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Safety & Compliance</CardTitle>
                <CardDescription>OSHA 30 & PPE compliance</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Submit daily safety tailgate meetings, ladder/scaffolding inspections, and incident reporting.
              </CardContent>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>
      </div>
    </div>
  );
}
