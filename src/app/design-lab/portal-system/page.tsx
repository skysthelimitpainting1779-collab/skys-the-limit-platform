import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, ArrowRight, LayoutDashboard, Users, HardHat } from "lucide-react";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Concept D: Portal System Architecture | Design Lab",
};

export default function PortalSystemConceptPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8 px-4">
      {/* Concept Header */}
      <div className="space-y-3 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500 text-amber-500 font-semibold">
            Concept D
          </Badge>
          <Badge className="bg-amber-500 text-black font-semibold">Preview Mode Only</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Unified Role-Based Portal Architecture
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          One coherent Sky’s design system providing role-aware application shells for Operations, Customer Hub, and Field Crew workflows.
        </p>
      </div>

      {/* Candidate Warning Banner */}
      <Card className="border-amber-500/40 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-foreground space-y-1">
            <div className="font-bold text-amber-500">PROTECTED DESIGN-LAB GATEWAY</div>
            <div>
              These role portals use internal preview assets and Convex schema models. Access is restricted under <code>NEXT_PUBLIC_SIGNATURE_DESIGN_PREVIEW=true</code> and <code>VERCEL_ENV !== &apos;production&apos;</code>.
            </div>
          </div>
        </div>
      </Card>

      {/* Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Operations */}
        <Card className="border-border bg-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground">1. Operations Command</h3>
            <p className="text-xs text-muted-foreground">
              Central operational dashboard for leads intake, estimate versioning, job stage dispatches, crew management, and Convex CMS editing.
            </p>
          </div>
          <Link href="/operations">
            <Button className="w-full bg-amber-500 text-black hover:bg-amber-400 font-semibold gap-2">
              Launch Operations Portal <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        {/* Customer */}
        <Card className="border-border bg-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground">2. Customer Hub</h3>
            <p className="text-xs text-muted-foreground">
              Calm, buyer-focused project status dashboard with written scope proposals, preparation guides, and direct owner contact lines.
            </p>
          </div>
          <Link href="/customer">
            <Button variant="outline" className="w-full gap-2">
              Launch Customer Hub <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        {/* Crew */}
        <Card className="border-border bg-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <HardHat className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground">3. Field Crew Portal</h3>
            <p className="text-xs text-muted-foreground">
              Mobile-first, single-handed workflow for active daily job assignments, surface preparation checklists, and live update submissions.
            </p>
          </div>
          <Link href="/crew">
            <Button variant="outline" className="w-full gap-2">
              Launch Field Crew Portal <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
