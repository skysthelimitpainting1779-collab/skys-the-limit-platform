import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Customer Portal | Sky's the Limit Painting",
  description: "Access your painting project estimates, timelines, color choices, and invoices.",
};

export default function CustomerPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="brand">Customer Portal</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Project Dashboard & Communication
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Track project progress, review color specifications, approve change orders, and view billing details.
            </p>
          </div>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Active Estimates</CardTitle>
                <CardDescription>Review and sign digital proposals</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                View detailed line items, paint product specifications, and scope descriptions.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Color Palette</CardTitle>
                <CardDescription>Approved color selections & sheen</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Confirm your color codes (Sherwin-Williams / Benjamin Moore) for each room and surface.
              </CardContent>
            </Card>
          </MotionStaggerItem>

          <MotionStaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>Invoices & Payments</CardTitle>
                <CardDescription>Secure online payment processing</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                Pay deposits or final balances securely via credit card or bank transfer.
              </CardContent>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>
      </div>
    </div>
  );
}
