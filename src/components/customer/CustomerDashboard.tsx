"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  CircleDollarSign,
  FileLock2,
  Home,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { usePortalWorkspace } from "@/components/portal/PortalShell";
import { Badge } from "@/components/ui/badge";
import { MotionReveal } from "@/design/motion/Reveal";

type CustomerPortalResult = {
  customer: {
    _id: Id<"customers">;
    orgId: Id<"organizations">;
    name: string;
    email: string;
    phone?: string;
    status: string;
  };
  properties: Array<{
    _id: Id<"properties">;
    label?: string;
    address: string;
    propertyType?: string;
    accessNotes?: string;
  }>;
  estimates: Array<{
    _id: Id<"estimates">;
    propertyId?: Id<"properties">;
    scope: string;
    pricing: number | Record<string, unknown>;
    status: string;
    createdAt: number;
  }>;
  jobs: Array<{
    _id: Id<"jobs">;
    propertyId?: Id<"properties">;
    title?: string;
    address?: string;
    status: string;
    schedule: number | string | Record<string, unknown>;
  }>;
  updates: Array<{
    _id: Id<"projectUpdates">;
    jobId: Id<"jobs">;
    message: string;
    createdAt: number;
  }>;
};

function formatPricing(pricing: number | Record<string, unknown>) {
  if (typeof pricing === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(pricing);
  }
  for (const key of ["total", "amount", "grandTotal"]) {
    const value = pricing[key];
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    }
  }
  return "Itemized pricing available";
}

function formatSchedule(schedule: CustomerPortalResult["jobs"][number]["schedule"]) {
  if (typeof schedule === "number") return new Date(schedule).toLocaleString();
  if (typeof schedule === "string") return schedule;
  for (const key of ["label", "date", "startDate", "start"]) {
    const value = schedule[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return new Date(value).toLocaleString();
  }
  return "Schedule details are being finalized";
}

function PortalSection({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 rounded-xl border border-border bg-card">
      <header className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function CustomerDashboard() {
  const workspace = usePortalWorkspace();
  const orgId = workspace?.selectedOrgId ?? null;
  const hasCustomerRole = workspace?.activeMembership?.role === "customer";
  const result = useQuery(
    api.customers.getMyPortal,
    orgId && hasCustomerRole ? { orgId } : "skip",
  ) as
    | CustomerPortalResult
    | null
    | undefined;

  if (!orgId && workspace?.context !== undefined) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-bold">No active customer organization</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A verified customer membership is required before project records can be loaded.
        </p>
      </div>
    );
  }

  if (orgId && workspace?.activeMembership && !hasCustomerRole) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-bold">Customer records are not available for this role</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page opens only for an exact customer membership and customer-record binding.
        </p>
      </div>
    );
  }

  if (result === undefined) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Verifying your customer account binding…
      </div>
    );
  }

  if (result === null) {
    return (
      <MotionReveal direction="up">
        <section className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
            Secure account linking required
          </h2>
          <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
            Your WorkOS session is valid, but it is not yet bound to a customer
            record. Project information remains hidden until an authorized
            invitation links this exact identity. Email addresses and record IDs
            are never accepted as proof of ownership.
          </p>
          <p className="mt-4 text-sm font-semibold">
            Contact the office to complete a verified account invitation.
          </p>
        </section>
      </MotionReveal>
    );
  }

  const { customer, properties, estimates, jobs, updates } = result;

  return (
    <div className="mt-8 space-y-5" data-testid="customer-dashboard">
      <MotionReveal direction="up">
        <section className="rounded-xl border border-border bg-foreground p-5 text-background sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-background/65">
                Verified customer record
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {customer.name}
              </h2>
              <div className="mt-4 flex flex-col gap-2 text-sm text-background/75 sm:flex-row sm:flex-wrap sm:gap-x-5">
                <span className="inline-flex items-center gap-2">
                  <Mail className="size-4" aria-hidden="true" />
                  {customer.email}
                </span>
                {customer.phone ? (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-4" aria-hidden="true" />
                    {customer.phone}
                  </span>
                ) : null}
              </div>
            </div>
            <Badge variant="secondary" className="w-fit capitalize">
              {customer.status.replaceAll("_", " ")}
            </Badge>
          </div>
        </section>
      </MotionReveal>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Customer record sections">
        {[
          ["properties", "Properties"],
          ["estimates", "Estimates"],
          ["schedule", "Schedule"],
          ["updates", "Updates"],
          ["documents", "Documents"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={`#${href}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-card px-4 text-sm font-bold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {label}
          </a>
        ))}
      </nav>

      <PortalSection
        id="properties"
        icon={<Home className="size-5" aria-hidden="true" />}
        title="Properties"
        description="Only properties linked to your verified customer record are shown."
      >
        {properties.length === 0 ? (
          <EmptyState>No properties are linked to this account.</EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((property) => (
              <article key={property._id} className="rounded-lg border border-border p-4">
                <h3 className="font-bold">{property.label || "Project property"}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {property.address}
                </p>
                {property.propertyType ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {property.propertyType}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </PortalSection>

      <PortalSection
        id="estimates"
        icon={<CircleDollarSign className="size-5" aria-hidden="true" />}
        title="Estimates"
        description="Pricing and scope come directly from estimates bound to this customer."
      >
        {estimates.length === 0 ? (
          <EmptyState>No estimates are available for this account.</EmptyState>
        ) : (
          <div className="space-y-3">
            {estimates.map((estimate) => (
              <article key={estimate._id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold">{estimate.scope}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Created {new Date(estimate.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold tabular-nums">{formatPricing(estimate.pricing)}</p>
                    <Badge variant="outline" className="mt-2 capitalize">
                      {estimate.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </PortalSection>

      <PortalSection
        id="schedule"
        icon={<CalendarDays className="size-5" aria-hidden="true" />}
        title="Project schedule"
        description="Scheduled work and current status for jobs on this customer record."
      >
        {jobs.length === 0 ? (
          <EmptyState>No scheduled jobs are available yet.</EmptyState>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <article key={job._id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{job.title || "Painting project"}</h3>
                    {job.address ? (
                      <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {job.address}
                      </p>
                    ) : null}
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" aria-hidden="true" />
                      {formatSchedule(job.schedule)}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {job.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        )}
      </PortalSection>

      <PortalSection
        id="updates"
        icon={<MessageSquareText className="size-5" aria-hidden="true" />}
        title="Project updates"
        description="Only updates explicitly marked customer-visible are returned by the server."
      >
        {updates.length === 0 ? (
          <EmptyState>No customer-visible project updates are available.</EmptyState>
        ) : (
          <ol className="space-y-3">
            {updates.map((update) => (
              <li key={update._id} className="rounded-lg border border-border p-4">
                <time className="text-xs font-semibold text-muted-foreground" dateTime={new Date(update.createdAt).toISOString()}>
                  {new Date(update.createdAt).toLocaleString()}
                </time>
                <p className="mt-2 text-sm leading-6">{update.message}</p>
              </li>
            ))}
          </ol>
        )}
      </PortalSection>

      <PortalSection
        id="documents"
        icon={<FileLock2 className="size-5" aria-hidden="true" />}
        title="Documents"
        description="Private files remain hidden until document grants are bound to this exact customer record."
      >
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-bold">No customer document grant is active</p>
          <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
            Document downloads fail closed here. The portal will not infer file
            ownership from an email address, project ID, or organization membership.
          </p>
        </div>
      </PortalSection>
    </div>
  );
}
