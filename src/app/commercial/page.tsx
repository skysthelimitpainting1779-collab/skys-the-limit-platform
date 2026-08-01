import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Commercial Painting Services | Sky's the Limit Painting",
  description: "Professional commercial painting contractors. Minimal disruption, strict safety standards, durable coatings.",
};

export default function CommercialPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="brand">Commercial Division</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Commercial & Industrial Coating Solutions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Professional crews, flexible scheduling, and high-performance commercial coatings designed for demanding retail, office, and industrial environments.
            </p>
          </div>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Retail & Office</CardTitle>
                <CardDescription>Tenant buildouts & facility maintenance</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Flexible scheduling to minimize operational disruption for business owners and property managers.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Multi-Family Housing</CardTitle>
                <CardDescription>HOAs, apartment complexes, & condos</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Comprehensive exterior repaint programs with tenant notification coordination and safety controls.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Specialty Coatings</CardTitle>
                <CardDescription>Epoxy floors & elastomeric wall coatings</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Heavy-duty surface protection engineered to withstand high traffic, chemical exposure, and extreme weather.
              </CardContent>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>

        <MotionReveal direction="up" delay={0.2}>
          <div className="flex items-center gap-4">
            <MotionPressable>
              <Button size="lg" variant="brand">
                Schedule Commercial Consultation
              </Button>
            </MotionPressable>
          </div>
        </MotionReveal>
      </div>
    </div>
  );
}
