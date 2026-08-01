import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Public Sector Painting | Sky's the Limit Painting",
  description: "Compliant public sector painting contractors. Municipal and educational painting projects.",
};

export default function PublicSectorPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="default">Public Sector & Municipal</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Certified Public Works Contracting
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Experienced with public agency procurement guidelines and safety compliance requirements.
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
              <CardContent className="text-sm text-muted-foreground">
                Summer and break window execution with quality paints and strict professional personnel.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Municipal Infrastructure</CardTitle>
                <CardDescription>City halls, fire stations, & transit facilities</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Proper insurance, safety adherence, and public agency compliance.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Parks & Recreation</CardTitle>
                <CardDescription>Public facilities & community centers</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Anti-graffiti protective coatings, weather-resistant wood preservatives, and durable high-use finishes.
              </CardContent>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>

        <MotionReveal direction="up" delay={0.2}>
          <div className="flex items-center gap-4">
            <MotionPressable>
              <Button size="lg" variant="default">
                Submit RFP / Public Bid Invite
              </Button>
            </MotionPressable>
          </div>
        </MotionReveal>
      </div>
    </div>
  );
}




