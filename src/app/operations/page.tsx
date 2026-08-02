"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Users, FileText, Briefcase, ShieldCheck, HardHat, Settings, Plus, ArrowUpRight } from "lucide-react";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Sample real-time operations data backed by Convex schema
  const leads = [
    { id: "lead-101", name: "Sarah Jenkins", email: "sarah.j@example.com", service: "Residential Interior", status: "new", city: "Milwaukee", date: "2026-08-01" },
    { id: "lead-102", name: "Oakland Commercial Center", email: "ops@oaklandcenter.com", service: "Commercial Exterior", status: "qualified", city: "Waukesha", date: "2026-07-31" },
    { id: "lead-103", name: "City of Greenfield Municipal", email: "procurement@greenfield.gov", service: "Public Sector", status: "scheduled", city: "Greenfield", date: "2026-07-30" },
  ];

  const jobs = [
    { id: "job-201", customer: "Oakland Commercial Center", stage: "prep", crew: "Crew Alpha (3)", start: "2026-08-03", progress: "45%" },
    { id: "job-202", customer: "Sarah Jenkins", stage: "in_progress", crew: "Crew Bravo (2)", start: "2026-08-02", progress: "70%" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations Command</h1>
          <p className="text-sm text-muted-foreground">
            Manage leads, estimate queues, active job dispatches, and CMS content publishing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            CMS Settings
          </Button>
          <Button size="sm" className="gap-2 bg-amber-500 text-black hover:bg-amber-400 font-semibold">
            <Plus className="w-4 h-4" />
            New Estimate
          </Button>
        </div>
      </div>

      {/* Actionable Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              New Leads
            </CardTitle>
            <Users className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">3</div>
            <p className="text-xs text-muted-foreground mt-1">Requires contact within 24h</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Estimates
            </CardTitle>
            <FileText className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">5</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting scope approval</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Jobs
            </CardTitle>
            <Briefcase className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2</div>
            <p className="text-xs text-muted-foreground mt-1">Field crews dispatched</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Security Audit Events
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">100% append-only verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="leads" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 max-w-md mb-6">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="cms">CMS</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Actionable Leads Queue</CardTitle>
                <CardDescription>Filterable lead records ingested via progressive intake.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Service Segment</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-semibold text-foreground">{lead.name}</TableCell>
                      <TableCell>{lead.service}</TableCell>
                      <TableCell>{lead.city}</TableCell>
                      <TableCell>
                        <Badge
                          variant={lead.status === "new" ? "default" : "outline"}
                          className={lead.status === "new" ? "bg-amber-500 text-black font-semibold" : ""}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs">
                          Details <ArrowUpRight className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-bold">Active Jobs & Stages</CardTitle>
              <CardDescription>Track preparation, coat application, and owner handoff stages.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Assigned Crew</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{job.id}</TableCell>
                      <TableCell className="font-semibold text-foreground">{job.customer}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-xs font-semibold">
                          {job.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.crew}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{job.progress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          <Card className="border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <HardHat className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-foreground">Field Crew Roster</h3>
                <p className="text-xs text-muted-foreground">Active assignments and safety certifications.</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg bg-background">
                <div className="font-bold text-foreground">Crew Alpha (Exterior & Commercial)</div>
                <div className="text-xs text-muted-foreground mt-1">Lead: Marcus Vance | 3 Members</div>
                <Badge className="mt-2 bg-emerald-600 text-white">Dispatched — Oakland Project</Badge>
              </div>
              <div className="p-4 border border-border rounded-lg bg-background">
                <div className="font-bold text-foreground">Crew Bravo (Residential Fine Finish)</div>
                <div className="text-xs text-muted-foreground mt-1">Lead: Elena Rostova | 2 Members</div>
                <Badge className="mt-2 bg-emerald-600 text-white">Dispatched — Jenkins Project</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cms" className="space-y-4">
          <Card className="border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Convex Typed CMS Management</h3>
                <p className="text-xs text-muted-foreground">Control public pages, services, FAQs, and asset publication.</p>
              </div>
              <Badge variant="outline" className="border-amber-500 text-amber-500">
                Typed Revisioning Active
              </Badge>
            </div>
            <div className="p-4 border border-border rounded-lg bg-background flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">Homepage (signatureHero & proofLayers)</span>
                <Badge className="bg-emerald-600 text-white">Published</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">Residential Page (writtenScopeProcess)</span>
                <Badge className="bg-emerald-600 text-white">Published</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">Commercial Page (capabilitySummary)</span>
                <Badge className="bg-amber-500 text-black font-semibold">In Review</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
