"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/design/motion/Reveal";
import { MotionStagger, MotionStaggerItem } from "@/design/motion/Stagger";
import { MotionPressable } from "@/design/motion/Pressable";

export function CrewDashboard({ orgId }: { orgId?: Id<"organizations"> }) {
  const capabilities = useQuery(
    api.users.getMyCapabilities,
    orgId ? { orgId } : "skip",
  );
  const jobs = useQuery(
    api.jobs.list,
    orgId && capabilities?.canReadJobs ? { orgId } : "skip",
  );
  const updateStatus = useMutation(api.jobs.updateStatus);

  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  if (!orgId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Crew tenant context is not configured.
        </CardContent>
      </Card>
    );
  }

  const handleUpdateStatus = async (
    jobId: Id<"jobs">,
    newStatus: "scheduled" | "in_progress" | "completed" | "cancelled"
  ) => {
    setStatusError(null);
    setUpdatingJobId(jobId);
    try {
      await updateStatus({ jobId, status: newStatus });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update job status.";
      setStatusError(msg);
    } finally {
      setUpdatingJobId(null);
    }
  };

  const formatSchedule = (schedule: number | Record<string, unknown> | string) => {
    if (typeof schedule === "number") {
      return new Date(schedule).toLocaleString();
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

  const getStatusBadgeVariant = (status: string) => {
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
    <div className="space-y-8" data-testid="crew-dashboard">
      {statusError && (
        <div
          data-testid="crew-status-error-alert"
          role="alert"
          className="p-3 text-sm rounded-md bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
        >
          {statusError}
        </div>
      )}

      {/* Field Dispatch Overview */}
      <MotionReveal direction="up">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Field Execution Schedule
            </h2>
            {jobs && (
              <Badge variant="outline" data-testid="crew-job-count-badge">
                {jobs.length} Active {jobs.length === 1 ? "Job" : "Jobs"}
              </Badge>
            )}
          </div>

          {capabilities === undefined ? (
            <Card data-testid="crew-jobs-loading-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                Loading crew dispatch schedule from Convex...
              </CardContent>
            </Card>
          ) : !capabilities.canReadJobs ? (
            <Card data-testid="crew-jobs-restricted-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Assigned jobs are not available for this organization role.
              </CardContent>
            </Card>
          ) : jobs === undefined ? (
            <Card data-testid="crew-jobs-loading-card">
              <CardContent className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                Loading crew dispatch schedule from Convex...
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card data-testid="crew-jobs-empty-card">
              <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No active jobs currently assigned to crew dispatch.
              </CardContent>
            </Card>
          ) : (
            <MotionStagger className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(jobs as Array<{ _id: string; status: string; schedule: number | string | Record<string, unknown>; crewIds: string[]; estimateId: string }>).map((job) => (
                <MotionStaggerItem key={job._id}>
                  <Card data-testid={`crew-job-card-${job._id}`} className="flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold">Job Dispatch</CardTitle>
                          <Badge variant={getStatusBadgeVariant(job.status)}>
                            {job.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="font-mono text-xs">ID: {job._id}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-medium text-slate-900 dark:text-slate-200">Schedule:</span>{" "}
                          {formatSchedule(job.schedule)}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900 dark:text-slate-200">Crew Assigned:</span>{" "}
                          {job.crewIds.length} Painters
                        </div>
                        <div>
                          <span className="font-medium text-slate-900 dark:text-slate-200">Estimate Linked:</span>{" "}
                          <span className="font-mono text-xs">{job.estimateId}</span>
                        </div>
                      </CardContent>
                    </div>

                    {capabilities.canUpdateJobs && <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {job.status !== "in_progress" && (
                          <MotionPressable className="flex-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="w-full bg-[#E65100] hover:bg-[#CC4400]"
                              disabled={updatingJobId === job._id}
                              onClick={() => handleUpdateStatus(job._id as Id<"jobs">, "in_progress")}
                              data-testid={`start-job-btn-${job._id}`}
                            >
                              {updatingJobId === job._id ? "Updating..." : "Start Job"}
                            </Button>
                          </MotionPressable>
                        )}
                        {job.status !== "completed" && (
                          <MotionPressable className="flex-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full"
                              disabled={updatingJobId === job._id}
                              onClick={() => handleUpdateStatus(job._id as Id<"jobs">, "completed")}
                              data-testid={`complete-job-btn-${job._id}`}
                            >
                              {updatingJobId === job._id ? "Updating..." : "Mark Complete"}
                            </Button>
                          </MotionPressable>
                        )}
                        {job.status !== "scheduled" && (
                          <MotionPressable className="flex-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              disabled={updatingJobId === job._id}
                              onClick={() => handleUpdateStatus(job._id as Id<"jobs">, "scheduled")}
                              data-testid={`schedule-job-btn-${job._id}`}
                            >
                              Reset
                            </Button>
                          </MotionPressable>
                        )}
                      </div>
                    </CardContent>}
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
