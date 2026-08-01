"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionPressable } from "@/design/motion/Pressable";

export interface EstimateFormProps {
  defaultOrgId?: Id<"organizations">;
  onSuccess?: (leadId: string) => void;
}

export function EstimateForm({ defaultOrgId, onSuccess }: EstimateFormProps = {}) {
  const createLead = useMutation(api.leads.create);
  const createEstimate = useMutation(api.estimates.create);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [projectType, setProjectType] = useState<"residential" | "commercial" | "public-sector">("residential");
  const [details, setDetails] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const leadId = await createLead({
        customerName,
        email,
        phone,
        address: address || undefined,
        projectType,
        notes: details || undefined,
      });

      if (defaultOrgId) {
        await createEstimate({
          leadId,
          orgId: defaultOrgId,
          scope: details || `Estimate request for ${projectType} project`,
          pricing: 0,
          status: "draft",
        });
      }

      setSubmittedLeadId(leadId);
      onSuccess?.(leadId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit estimate request. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCustomerName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setProjectType("residential");
    setDetails("");
    setSubmittedLeadId(null);
    setError(null);
  };

  if (submittedLeadId) {
    return (
      <Card data-testid="estimate-success-card">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-400">Request Submitted!</CardTitle>
          <CardDescription>
            Thank you, {customerName}. We have received your estimate request for {projectType} painting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Lead Reference: <span className="font-mono text-slate-900 dark:text-slate-100">{submittedLeadId}</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
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
    <Card data-testid="estimate-form-card">
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
        <CardDescription>Tell us about your painting project needs</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            data-testid="estimate-error-alert"
            role="alert"
            className="mb-4 p-3 text-sm rounded-md bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
          >
            {error}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <Input
                id="fullName"
                placeholder="Jane Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="projectType" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Project Type
              </label>
              <select
                id="projectType"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E65100] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as "residential" | "commercial" | "public-sector")}
                required
                disabled={isSubmitting}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="public-sector">Public Sector</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Property Address
            </label>
            <Input
              id="address"
              placeholder="123 Main St, City, State ZIP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="details" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Project Details & Scope
            </label>
            <Input
              id="details"
              placeholder="Describe the area, square footage, timelines, or color preferences..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-4">
            <MotionPressable>
              <Button type="submit" size="lg" className="w-full bg-[#E65100] hover:bg-[#CC4400]" disabled={isSubmitting}>
                {isSubmitting ? "Submitting Request..." : "Submit Estimate Request"}
              </Button>
            </MotionPressable>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
