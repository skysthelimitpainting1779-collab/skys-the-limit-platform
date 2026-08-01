import type { Metadata } from "next";
import { MotionReveal } from "@/design/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { CustomerDashboard } from "@/components/customer/CustomerDashboard";

export const metadata: Metadata = {
  title: "Customer Portal | Sky's the Limit Painting",
  description: "Access your painting project estimates, timelines, color choices, and invoices.",
};

export default function CustomerPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <MotionReveal direction="down">
          <div className="space-y-4">
            <Badge variant="default">Customer Portal</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Project Dashboard & Communication
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Track project progress, review color specifications, approve change orders, and view billing details.
            </p>
          </div>
        </MotionReveal>

        <CustomerDashboard />
      </div>
    </div>
  );
}

