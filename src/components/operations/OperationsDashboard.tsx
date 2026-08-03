"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";

export function OperationsDashboard({ orgId }: { orgId?: Id<"organizations"> }) {
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>("all");
  const capabilities = useQuery(
    api.users.getMyCapabilities,
    orgId ? { orgId } : "skip",
  );

  const leads = useQuery(
    api.leads.list,
    orgId && capabilities?.canManageLeads
      ? selectedLeadStatus !== "all"
        ? { orgId, status: selectedLeadStatus as "new" | "contacted" | "qualified" | "scheduled" | "closed" | "lost" }
        : { orgId }
      : "skip"
  );
  const jobs = useQuery(
    api.jobs.list,
    orgId && capabilities?.canReadJobs ? { orgId } : "skip",
  );
  const auditEvents = useQuery(
    api.auditEvents.listRecent,
    orgId && capabilities?.canReadAudit ? { orgId, limit: 15 } : "skip",
  );

  const updateLeadStatus = useMutation(api.leads.updateStatus);
  const updateJobStatus = useMutation(api.jobs.updateStatus);

  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [opError, setOpError] = useState<string | null>(null);

  if (!orgId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Operations tenant context is not configured.
        </CardContent>
      </Card>
    );
  }

  const handleLeadStatusChange = async (leadId: Id<"leads">, newStatus: "new" | "contacted" | "qualified" | "scheduled" | "closed" | "lost") => {
    setOpError(null);
    setUpdatingLeadId(leadId);
    try {
      await updateLeadStatus({ leadId, status: newStatus });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update lead status.";
      setOpError(msg);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleJobStatusChange = async (jobId: Id<"jobs">, newStatus: "scheduled" | "in_progress" | "completed" | "cancelled") => {
    setOpError(null);
    setUpdatingJobId(jobId);
    try {
      await updateJobStatus({ jobId, status: newStatus });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update job status.";
      setOpError(msg);
    } finally {
      setUpdatingJobId(null);
    }
  };

  const getProjectTypeBadge = (type: string) => {
    switch (type) {
      case "residential":
        return "secondary";
      case "commercial":
        return "default";
      case "public-sector":
        return "default";
      default:
        return "outline";
    }
  };

  const getLeadStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return "default";
      case "contacted":
      case "qualified":
      case "scheduled":
        return "secondary";
      case "closed":
        return "default";
      case "lost":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-8" data-testid="operations-dashboard">
      {opError && (
        <div
          data-testid="operations-error-alert"
          role="alert"
          className="p-3 text-sm rounded-md bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
        >
          {opError}
        </div>
      )}

      {/* Section 1: Estimating Pipeline & Inbound Leads */}
      <MotionReveal direction="up">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Inbound Lead Pipeline
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track incoming estimate requests and pipeline conversions
              </p>
            </div>
            {capabilities?.canManageLeads && <div className="flex items-center gap-2">
              <label htmlFor="lead-status-filter" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Filter:
              </label>
              <select
                id="lead-status-filter"
                data-testid="lead-status-filter"
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E65100] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                value={selectedLeadStatus}
                onChange={(e) => setSelectedLeadStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="scheduled">Scheduled</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>
            </div>}
          </div>

          {capabilities === undefined ? (
            <Card data-testid="leads-loading-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                Loading lead pipeline from Convex...
              </CardContent>
            </Card>
          ) : !capabilities.canManageLeads ? (
            <Card data-testid="leads-restricted-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Lead management is not available for this organization role.
              </CardContent>
            </Card>
          ) : leads === undefined ? (
            <Card data-testid="leads-loading-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                Loading lead pipeline from Convex...
              </CardContent>
            </Card>
          ) : leads.length === 0 ? (
            <Card data-testid="leads-empty-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No leads found matching filter.
              </CardContent>
            </Card>
          ) : (
            <MotionStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(leads as Array<{ _id: Id<"leads">; fullName: string; email: string; phone: string; serviceAddress?: string; notes?: string; segment: string; status: string }>).map((lead) => (
                <MotionStaggerItem key={lead._id}>
                  <Card data-testid={`lead-card-${lead._id}`} className="flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-semibold">{lead.fullName}</CardTitle>
                        <Badge variant={getProjectTypeBadge(lead.segment)}>
                          {lead.segment}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs font-mono">ID: {lead._id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground pb-3">
                      <div>
                        <span className="font-medium text-foreground">Email:</span> {lead.email}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Phone:</span> {lead.phone}
                      </div>
                      {lead.serviceAddress && (
                        <div>
                          <span className="font-medium text-foreground">Address:</span> {lead.serviceAddress}
                        </div>
                      )}
                      {lead.notes && (
                        <div className="text-xs italic bg-muted p-2 rounded border border-border">
                          &quot;{lead.notes}&quot;
                        </div>
                      )}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <Badge variant={getLeadStatusBadge(lead.status)}>
                          {lead.status.toUpperCase()}
                        </Badge>
                        <select
                          className="h-8 rounded text-xs border border-slate-300 bg-white px-2 py-0 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                          value={lead.status}
                          disabled={updatingLeadId === lead._id}
                          onChange={(e) => handleLeadStatusChange(lead._id as Id<"leads">, e.target.value as "new" | "contacted" | "qualified" | "scheduled" | "closed" | "lost")}
                          data-testid={`update-lead-status-${lead._id}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="closed">Closed</option>
                          <option value="lost">Lost</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          )}
        </div>
      </MotionReveal>

      {/* Section 2: Active Operations & Job Tracking */}
      <MotionReveal direction="up" delay={0.1}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Active Field Operations
          </h2>

          {capabilities === undefined ? (
            <Card data-testid="ops-jobs-loading-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                Loading job executions...
              </CardContent>
            </Card>
          ) : !capabilities.canReadJobs ? (
            <Card data-testid="ops-jobs-restricted-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Job operations are not available for this organization role.
              </CardContent>
            </Card>
          ) : jobs === undefined ? (
            <Card data-testid="ops-jobs-loading-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                Loading job executions...
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card data-testid="ops-jobs-empty-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No active jobs currently in system.
              </CardContent>
            </Card>
          ) : (
            <MotionStagger className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(jobs as Array<{ _id: Id<"jobs">; status: string; crewIds: string[]; estimateId: string; schedule: number | string | Record<string, unknown> }>).map((job) => (
                <MotionStaggerItem key={job._id}>
                  <Card data-testid={`ops-job-card-${job._id}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-base font-semibold">Job {job._id}</CardTitle>
                        <CardDescription className="text-xs font-mono">Estimate: {job.estimateId}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          job.status === "in_progress"
                            ? "brand"
                            : job.status === "completed"
                            ? "default"
                            : job.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {job.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between items-center">
                        <span>Crew Assigned:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{job.crewIds.length} Painters</span>
                      </div>
                      {capabilities.canUpdateJobs && <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-slate-500">Update Status:</span>
                        <select
                          className="h-8 rounded text-xs border border-slate-300 bg-white px-2 py-0 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                          value={job.status}
                          disabled={updatingJobId === job._id}
                          onChange={(e) => handleJobStatusChange(job._id as Id<"jobs">, e.target.value as "scheduled" | "in_progress" | "completed" | "cancelled")}
                          data-testid={`ops-job-status-select-${job._id}`}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>}
                    </CardContent>
                  </Card>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          )}
        </div>
      </MotionReveal>

      {/* Section 3: Audit Trail Log */}
      <MotionReveal direction="up" delay={0.2}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Recent System Audit Trail
          </h2>

          {capabilities === undefined ? (
            <Card data-testid="audit-loading-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                Loading audit trail from Convex...
              </CardContent>
            </Card>
          ) : !capabilities.canReadAudit ? (
            <Card data-testid="audit-restricted-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Audit logs are restricted to organization administrators and owners.
              </CardContent>
            </Card>
          ) : auditEvents === undefined ? (
            <Card data-testid="audit-loading-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                Loading audit trail from Convex...
              </CardContent>
            </Card>
          ) : auditEvents.length === 0 ? (
            <Card data-testid="audit-empty-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No recent audit events logged.
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="audit-list-card">
              <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                {(auditEvents as Array<{ _id: string; action: string; targetResource: string; actorId: string; timestamp: number }>).map((evt) => (
                  <div
                    key={evt._id}
                    data-testid={`audit-event-${evt._id}`}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{evt.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {evt.targetResource}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Actor: {evt.actorId}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </MotionReveal>
    </div>
  );
}
