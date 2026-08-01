import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Estimating Pipeline</CardTitle>
                <CardDescription>Inbound leads & active proposals</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Track pending estimates, hit rates, project scopes, and follow-up schedules.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Resource Allocation</CardTitle>
                <CardDescription>Crew assignments & equipment</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Manage crew leader assignments, spray rig availability, and ladder/scaffolding inventory.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Gross margins & prevailing wage logs</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Monitor job costing vs estimate baseline, certified payroll reports, and material spend.
              </CardContent>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>
      </div>
    </div>
  );
}
