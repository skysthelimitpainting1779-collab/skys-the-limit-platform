"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, FileText, Phone, MapPin, Download } from "lucide-react";

export default function CustomerPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, Sarah</h1>
          <p className="text-sm text-muted-foreground">
            Track your ongoing painting transformation and access written scope documentation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Phone className="w-4 h-4 text-amber-500" />
            Contact Owner Direct
          </Button>
        </div>
      </div>

      {/* Primary Project Progress Card */}
      <Card className="border-border bg-card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge className="bg-emerald-600 text-white font-semibold mb-2">Active Project in Progress</Badge>
            <h2 className="text-xl font-bold text-foreground">Residential Interior Transformation</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-amber-500" /> 1420 N Prospect Ave, Milwaukee, WI
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Estimated Completion</div>
            <div className="text-lg font-bold text-foreground">August 4, 2026</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Overall Progress</span>
            <span className="text-foreground">70%</span>
          </div>
          <Progress value={70} className="h-3 bg-muted" />
        </div>

        {/* Project Stage Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-foreground">1. Substrate Prep</div>
              <div className="text-[11px] text-muted-foreground">Sanding & Masking Complete</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-foreground">2. Primer Coat</div>
              <div className="text-[11px] text-muted-foreground">High-Bond Sealer Applied</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-foreground">3. Finish Coat</div>
              <div className="text-[11px] text-muted-foreground">In Progress (Coat 2 of 2)</div>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-60">
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-foreground">4. Final Walkthrough</div>
              <div className="text-[11px] text-muted-foreground">Owner Inspection</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Documents Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" /> Written Scope & Proposal
            </CardTitle>
            <CardDescription>Verified scope specification document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border border-border rounded bg-background flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-foreground">Scope_Agreement_Jenkins_v2.pdf</div>
                <div className="text-xs text-muted-foreground">Signed July 28, 2026 • 2.4 MB</div>
              </div>
              <Button size="sm" variant="ghost">
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 border border-border rounded bg-background flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-foreground">Preparation_Guideline_Homeowner.pdf</div>
                <div className="text-xs text-muted-foreground">Access & furniture guidelines • 1.1 MB</div>
              </div>
              <Button size="sm" variant="ghost">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold">Assigned Field Contacts</CardTitle>
            <CardDescription>Direct line to your project leads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border border-border rounded bg-background">
              <div className="font-bold text-foreground">Elena Rostova</div>
              <div className="text-xs text-muted-foreground">Crew Lead — Fine Finish Specialist</div>
              <div className="text-xs text-amber-500 font-mono mt-1">(414) 555-0192</div>
            </div>
            <div className="p-3 border border-border rounded bg-background">
              <div className="font-bold text-foreground">Sky’s Project Operations</div>
              <div className="text-xs text-muted-foreground">Owner / Master Estimator Office</div>
              <div className="text-xs text-amber-500 font-mono mt-1">(414) 555-0100</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
