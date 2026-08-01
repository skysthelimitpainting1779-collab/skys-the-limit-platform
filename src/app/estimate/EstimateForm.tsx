"use client";

import { useRef, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; receiptId: string }
  | { status: "error"; message: string };

const controlClassName =
  "flex min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function EstimateForm() {
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const idempotencyKey = useRef<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const searchParams = new URLSearchParams(window.location.search);

    idempotencyKey.current ??= crypto.randomUUID();
    setSubmission({ status: "submitting" });

    const payload = {
      fullName: readText(formData, "fullName"),
      email: readText(formData, "email"),
      phone: readText(formData, "phone"),
      segment: readText(formData, "segment"),
      serviceAddress: readText(formData, "serviceAddress"),
      projectDetails: readText(formData, "projectDetails"),
      desiredTimeframe: readText(formData, "desiredTimeframe") || undefined,
      contactConsent: formData.get("contactConsent") === "on",
      companyWebsite: readText(formData, "companyWebsite"),
      sourcePath: window.location.pathname,
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined,
      idempotencyKey: idempotencyKey.current,
    };

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as {
        receiptId?: string;
        error?: string;
      };

      if (!response.ok || !result.receiptId) {
        const message =
          result.error === "rate_limited"
            ? "We received several recent requests. Please try again in a few minutes."
            : result.error === "validation_failed"
              ? "Review the highlighted information and try again."
              : "We could not save your request right now. Your information is still in the form—please try again.";
        setSubmission({ status: "error", message });
        return;
      }

      form.reset();
      idempotencyKey.current = null;
      setSubmission({ status: "success", receiptId: result.receiptId });
    } catch {
      setSubmission({
        status: "error",
        message: "We could not reach the estimate service. Your information is still in the form—please try again.",
      });
    }
  }

  const isSubmitting = submission.status === "submitting";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project information</CardTitle>
        <CardDescription>
          Required fields help us understand the scope before we follow up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </label>
              <Input id="fullName" name="fullName" autoComplete="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone number
              </label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="segment" className="text-sm font-medium">
                Project type
              </label>
              <select id="segment" name="segment" className={controlClassName} defaultValue="" required>
                <option value="" disabled>
                  Select a project type
                </option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="public-sector">Public sector</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="serviceAddress" className="text-sm font-medium">
              Service address
            </label>
            <Input
              id="serviceAddress"
              name="serviceAddress"
              autoComplete="street-address"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="projectDetails" className="text-sm font-medium">
              Project details
            </label>
            <textarea
              id="projectDetails"
              name="projectDetails"
              className={`${controlClassName} min-h-32 resize-y`}
              placeholder="Areas to paint, current condition, approximate size, access concerns, or other useful details"
              minLength={20}
              maxLength={4000}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="desiredTimeframe" className="text-sm font-medium">
              Desired timeframe <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="desiredTimeframe"
              name="desiredTimeframe"
              placeholder="For example: within 30 days"
              maxLength={120}
            />
          </div>

          <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
            <label htmlFor="companyWebsite">Company website</label>
            <input
              id="companyWebsite"
              name="companyWebsite"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <label className="flex items-start gap-3 text-sm leading-6">
            <input
              name="contactConsent"
              type="checkbox"
              className="mt-1 size-4 rounded border-input accent-primary"
              required
            />
            <span>
              I agree that Sky&apos;s the Limit Painting LLC may contact me about this estimate request.
            </span>
          </label>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving request…" : "Request estimate"}
          </Button>

          <div aria-live="polite" aria-atomic="true">
            {submission.status === "success" ? (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
                <p className="font-semibold">Your request was saved.</p>
                <p className="mt-1 text-muted-foreground">
                  Reference: {submission.receiptId}. We will review the scope and follow up using the contact information you provided.
                </p>
              </div>
            ) : null}
            {submission.status === "error" ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {submission.message}
              </div>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
