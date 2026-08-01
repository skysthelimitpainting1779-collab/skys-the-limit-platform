import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Residential Painting Services | Sky's the Limit Painting",
  description: "Premium interior and exterior residential painting for homeowners. Prep-first quality, clean execution.",
};

export default function ResidentialPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="default">Residential Division</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Transforming Homes with Prep-First Precision
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              From interior detail refinishing to full exterior weatherproofing, our owner-led teams deliver lasting beauty with minimal disruption.
            </p>
          </div>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Interior Painting</CardTitle>
                <CardDescription>Walls, ceilings, trim, & custom cabinetry</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Thorough surface prep, dust isolation, quality premium paints, and immaculate cleanup every evening.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Exterior Weatherproofing</CardTitle>
                <CardDescription>Siding, fascia, trim, & exterior decks</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Power washing, scraping, priming, sealant application, and high-durability topcoats engineered for all weather conditions.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Cabinet Refinishing</CardTitle>
                <CardDescription>Kitchen & bathroom woodwork transformation</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Smooth professional enamel finishes that update kitchen spaces at a fraction of full replacement cost.
              </CardContent>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>

        <MotionReveal direction="up" delay={0.2}>
          <div className="flex items-center gap-4">
            <MotionPressable>
              <Button size="lg" variant="default">
                Request Residential Estimate
              </Button>
            </MotionPressable>
          </div>
        </MotionReveal>
      </div>
    </div>
  );
}

