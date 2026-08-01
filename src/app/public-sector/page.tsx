import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Public Sector & Prevailing Wage Painting | Sky's the Limit Painting",
  description: "Compliant public sector painting contractors. Prevailing wage certified, municipal & educational projects.",
};

export default function PublicSectorPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="brand">Public Sector & Municipal</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Certified Public Works Contracting
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Fully compliant with prevailing wage reporting, OSHA 30 safety compliance, certified payroll, and public agency procurement guidelines.
            </p>
          </div>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Schools & Universities</CardTitle>
                <CardDescription>K-12 campuses & higher education</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Summer and break window execution with zero-VOC paints and strict background-checked personnel.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Municipal Infrastructure</CardTitle>
                <CardDescription>City halls, fire stations, & transit facilities</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Rigorous bonding capacity, certified payroll compliance (DIR/L&I), and public safety adherence.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Parks & Recreation</CardTitle>
                <CardDescription>Public facilities & community centers</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Anti-graffiti protective coatings, weather-resistant wood preservatives, and durable high-use finishes.
              </CardContent>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>

        <MotionReveal direction="up" delay={0.2}>
          <div className="flex items-center gap-4">
            <MotionPressable>
              <Button size="lg" className="bg-[#E65100] hover:bg-[#CC4400]">
                Submit RFP / Public Bid Invite
              </Button>
            </MotionPressable>
          </div>
        </MotionReveal>
      </div>
    </div>
  );
}
