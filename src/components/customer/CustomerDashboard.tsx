"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";
import { computeTotalFromPricing } from "@convex/estimates";

export interface CustomerDashboardProps {
  defaultLeadId?: string;
  defaultOrgId?: string;
}

export function CustomerDashboard({ defaultLeadId = "", defaultOrgId }: CustomerDashboardProps) {
  const [leadIdInput, setLeadIdInput] = useState(defaultLeadId);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(defaultLeadId || null);

  const estimates = useQuery(
    api.estimates.listByLead,
    activeLeadId ? { leadId: activeLeadId as Id<"leads"> } : "skip"
  );

  const jobs = useQuery(
    api.jobs.list,
    defaultOrgId ? { orgId: defaultOrgId as Id<"organizations"> } : {}
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadIdInput.trim()) {
      setActiveLeadId(leadIdInput.trim());
    } else {
      setActiveLeadId(null);
    }
  };

  const formatPricing = (pricing: number | Record<string, unknown>) => {
    const total = computeTotalFromPricing(pricing);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total);
  };

  const formatSchedule = (schedule: number | Record<string, unknown> | string) => {
    if (typeof schedule === "number") {
      return new Date(schedule).toLocaleDateString();
    }
    if (typeof schedule === "string") {
      return schedule;
    }
    if (typeof schedule === "object" && schedule !== null) {
      const s = schedule as Record<string, unknown>;
      return (typeof s.date === "string" ? s.date : null) ||
        (typeof s.startDate === "string" ? s.startDate : null) ||
        JSON.stringify(schedule);
    }
    return "Scheduled";
  };

  const getEstimateBadgeVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "brand";
      case "sent":
        return "secondary";
      case "declined":
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getJobBadgeVariant = (status: string) => {
    switch (status) {
      case "in_progress":
        return "brand";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8" data-testid="customer-dashboard">
      <MotionReveal direction="down">
        <Card data-testid="customer-lookup-card">
          <CardHeader>
            <CardTitle>Look Up Your Project Estimates</CardTitle>
            <CardDescription>Enter your Lead Reference ID from your estimate confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4 flex-col sm:flex-row">
              <Input
                placeholder="Enter Lead ID (e.g. leads_123)..."
                value={leadIdInput}
                onChange={(e) => setLeadIdInput(e.target.value)}
                className="flex-1"
                aria-label="Lead Reference ID"
              />
              <MotionPressable>
                <Button type="submit" variant="default" className="w-full sm:w-auto">
                  Lookup Estimates
                </Button>
              </MotionPressable>
            </form>
          </CardContent>
        </Card>
      </MotionReveal>

      {/* Active Estimates Section */}
      <MotionReveal direction="up" delay={0.1}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Your Estimates
            </h2>
            {activeLeadId && (
              <Badge variant="outline">
                Filter: <span className="font-mono ml-1">{activeLeadId}</span>
              </Badge>
            )}
          </div>

          {!activeLeadId ? (
            <Card data-testid="estimates-prompt-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Enter your Lead Reference ID above to load your active painting proposals.
              </CardContent>
            </Card>
          ) : estimates === undefined ? (
            <Card data-testid="estimates-loading-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                Loading estimate records from Convex...
              </CardContent>
            </Card>
          ) : estimates.length === 0 ? (
            <Card data-testid="estimates-empty-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No estimates found for lead ID <span className="font-mono">{activeLeadId}</span>.
              </CardContent>
            </Card>
          ) : (
            <MotionStagger className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(estimates as Array<{ _id: string; scope: string; status: string; pricing: number | Record<string, unknown>; createdAt: number }>).map((est) => (
                <MotionStaggerItem key={est._id}>
                  <Card data-testid={`estimate-card-${est._id}`}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold">{est.scope}</CardTitle>
                        <CardDescription className="text-xs font-mono">ID: {est._id}</CardDescription>
                      </div>
                      <Badge variant={getEstimateBadgeVariant(est.status)}>
                        {est.status.toUpperCase()}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between items-center font-medium text-slate-900 dark:text-slate-100">
                        <span>Total Pricing:</span>
                        <span className="text-lg font-bold text-[#E65100]">
                          {formatPricing(est.pricing)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Created: {new Date(est.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          )}
        </div>
      </MotionReveal>

      {/* Active Jobs & Project Status Section */}
      <MotionReveal direction="up" delay={0.2}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Scheduled Jobs & Project Execution
          </h2>

          {jobs === undefined ? (
            <Card data-testid="jobs-loading-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                Loading job schedule from Convex...
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card data-testid="jobs-empty-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No active jobs currently scheduled.
              </CardContent>
            </Card>
          ) : (
            <MotionStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(jobs as Array<{ _id: string; status: string; schedule: number | string | Record<string, unknown>; crewIds: string[]; estimateId: string }>).map((job) => (
                <MotionStaggerItem key={job._id}>
                  <Card data-testid={`job-card-${job._id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Job Reference</CardTitle>
                        <Badge variant={getJobBadgeVariant(job.status)}>
                          {job.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription className="font-mono text-xs">{job._id}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-200">Schedule:</span>{" "}
                        {formatSchedule(job.schedule)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-200">Assigned Crew:</span>{" "}
                        {job.crewIds.length > 0 ? `${job.crewIds.length} Painters` : "Pending Dispatch"}
                      </div>
                    </CardContent>
                  </Card>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          )}
        </div>
      </MotionReveal>
    </div>
  );
}
