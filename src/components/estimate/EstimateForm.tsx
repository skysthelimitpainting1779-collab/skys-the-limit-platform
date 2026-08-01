"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MotionPressable } from "@/design/motion/Pressable";

export interface EstimateFormProps {
  defaultOrgId?: Id<"organizations">;
  onSuccess?: (leadId: string) => void;
}

export function EstimateForm({ defaultOrgId, onSuccess }: EstimateFormProps = {}) {
  const createLead = useMutation(api.leads.create);
  const createEstimate = useMutation(api.estimates.create);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [segment, setSegment] = useState<"residential" | "commercial" | "public-sector">("residential");
  const [projectDetails, setProjectDetails] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createLead({
        idempotencyKey: crypto.randomUUID(),
        fullName,
        email,
        phone,
        segment,
        serviceAddress,
        projectDetails,
        sourcePath: "/estimate",
      });

      if (defaultOrgId) {
        await createEstimate({
          leadId: result.id,
          orgId: defaultOrgId,
          scope: projectDetails || `Estimate request for ${segment} project`,
          pricing: 0,
          status: "draft",
        });
      }

      setSubmittedLeadId(result.id);
      onSuccess?.(result.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit estimate request. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setServiceAddress("");
    setSegment("residential");
    setProjectDetails("");
    setSubmittedLeadId(null);
    setError(null);
  };

  if (submittedLeadId) {
    return (
      <Card data-testid="estimate-success-card" className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-400">Request Submitted!</CardTitle>
          <CardDescription>
            Thank you, {fullName}. We have received your estimate request for {segment} painting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Lead Reference: <span className="font-mono text-foreground">{submittedLeadId}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Our estimating team will review your project details and contact you at <span className="font-medium">{email}</span> or <span className="font-medium">{phone}</span> within 24 hours.
          </p>
          <MotionPressable>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Submit Another Request
            </Button>
          </MotionPressable>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="estimate-form">
      <CardHeader className="p-0">
        <CardTitle className="text-2xl font-bold">Estimate Request Form</CardTitle>
        <CardDescription>
          Provide your project scope details to receive a fixed-scope proposal.
        </CardDescription>
      </CardHeader>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            required
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            required
            placeholder="(612) 555-0199"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="segment">Project Segment</Label>
          <select
            id="segment"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={segment}
            onChange={(e) => setSegment(e.target.value as "residential" | "commercial" | "public-sector")}
          >
            <option value="residential">Residential (Home/Condo)</option>
            <option value="commercial">Commercial (Office/Facility)</option>
            <option value="public-sector">Public Sector (Municipal/Gov)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="serviceAddress">Service Address</Label>
        <Input
          id="serviceAddress"
          type="text"
          required
          placeholder="123 Main St, Minneapolis, MN 55401"
          value={serviceAddress}
          onChange={(e) => setServiceAddress(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectDetails">Project Scope &amp; Details</Label>
        <Textarea
          id="projectDetails"
          rows={4}
          required
          placeholder="Describe the rooms, surface conditions, timing expectations, or access instructions..."
          value={projectDetails}
          onChange={(e) => setProjectDetails(e.target.value)}
        />
      </div>

      <MotionPressable>
        <Button type="submit" disabled={isSubmitting} className="w-full text-base font-semibold shadow-lg">
          {isSubmitting ? "Submitting Estimate Request..." : "Submit Estimate Request"}
        </Button>
      </MotionPressable>
    </form>
  );
}
