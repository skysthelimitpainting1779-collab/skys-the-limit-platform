"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  FileText,
  Search,
  Users,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { usePortalWorkspace } from "@/components/portal/PortalShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionReveal } from "@/design/motion/Reveal";

type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "scheduled"
  | "closed"
  | "lost";
type EstimateStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
type ClaimStatus = "candidate" | "verified" | "rejected";
type PageStatus = "draft" | "in_review" | "published" | "archived";
type AppRole =
  | "owner"
  | "admin"
  | "estimator"
  | "project_manager"
  | "crew_lead"
  | "crew_member"
  | "crew"
  | "staff"
  | "customer"
  | "content_editor"
  | "content_approver";

type LeadRow = {
  _id: Id<"leads">;
  fullName: string;
  email: string;
  phone: string;
  serviceAddress?: string;
  customerId?: Id<"customers">;
  segment: string;
  status: LeadStatus;
};
type EstimateRow = {
  _id: Id<"estimates">;
  leadId: Id<"leads">;
  scope: string;
  pricing: number | Record<string, unknown>;
  status: EstimateStatus;
  createdAt: number;
};
type JobRow = {
  _id: Id<"jobs">;
  estimateId?: Id<"estimates">;
  title?: string;
  address?: string;
  status: JobStatus;
  crewIds: Id<"users">[];
  schedule: number | string | Record<string, unknown>;
};
type CustomerRow = {
  _id: Id<"customers">;
  userId?: Id<"users">;
  name: string;
  email: string;
  phone?: string;
  status?: string;
};
type AssignableCrewRow = {
  userId: Id<"users">;
  name: string;
  email: string;
  role: "crew_lead" | "crew_member" | "crew";
};
type TeamMembershipRow = {
  membershipId: Id<"memberships">;
  userId: Id<"users">;
  name: string;
  email: string;
  role: AppRole | "member";
  status: "active" | "invited";
  workosRoleSlug?: string;
};
type ClaimRow = {
  _id: Id<"claims">;
  claimKey: string;
  text: string;
  status: ClaimStatus;
};
type CmsPageRow = {
  _id: Id<"cmsPages">;
  title: string;
  slug: string;
  status: PageStatus;
};
type NotificationRow = {
  _id: Id<"notifications">;
  title: string;
  body?: string;
  message?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: number;
  timestamp?: number;
};
type DocumentRow = {
  _id: Id<"documents">;
  name: string;
  mimeType: string;
  size: number;
  accessLevel: string;
  createdAt?: number;
};

const OPERATIONS_ROLES = new Set([
  "owner",
  "admin",
  "estimator",
  "project_manager",
  "staff",
]);
const ROLE_OPTIONS: Array<{ value: AppRole; label: string }> = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Administrator" },
  { value: "project_manager", label: "Project manager" },
  { value: "estimator", label: "Estimator" },
  { value: "staff", label: "Staff" },
  { value: "crew_lead", label: "Crew lead" },
  { value: "crew_member", label: "Crew member" },
  { value: "content_approver", label: "Content approver" },
  { value: "content_editor", label: "Content editor" },
  { value: "customer", label: "Customer" },
];
function formatMoney(pricing: number | Record<string, unknown>) {
  const total =
    typeof pricing === "number"
      ? pricing
      : typeof pricing.total === "number"
        ? pricing.total
        : undefined;
  if (total === undefined) return "Itemized pricing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(total);
}

function formatSchedule(value: JobRow["schedule"]) {
  if (typeof value === "number") return new Date(value).toLocaleString();
  if (typeof value === "string") return value;
  const candidate = value.date ?? value.startDate ?? value.start;
  if (typeof candidate === "string") return candidate;
  if (typeof candidate === "number") return new Date(candidate).toLocaleString();
  return "Schedule pending";
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-36 border-t border-border pt-8">
      <div className="mb-5 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-[-0.025em]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 px-5 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function OperationsDashboard() {
  const workspace = usePortalWorkspace();
  const activeOrgId = workspace?.selectedOrgId ?? null;
  const [leadStatus, setLeadStatus] = useState<"all" | LeadStatus>("all");
  const [searchText, setSearchText] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [estimateDraft, setEstimateDraft] = useState<{
    leadId: Id<"leads">;
    scope: string;
    total: string;
  } | null>(null);
  const [jobDraft, setJobDraft] = useState<{
    estimateId: Id<"estimates">;
    startsAt: string;
  } | null>(null);
  const [crewDraft, setCrewDraft] = useState<{
    jobId: Id<"jobs">;
    crewIds: Id<"users">[];
  } | null>(null);
  const [customerLinkDraft, setCustomerLinkDraft] = useState<{
    customerId: Id<"customers">;
    userId: string;
  } | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AppRole>>({});

  const capabilities = useQuery(
    api.users.getMyCapabilities,
    activeOrgId ? { orgId: activeOrgId } : "skip",
  );
  const role = capabilities?.role;
  const canOperate = Boolean(role && OPERATIONS_ROLES.has(role));
  const canManageContent = capabilities?.canEditContent === true;
  const canApproveContent = capabilities?.canPublishContent === true;
  const canReadDocuments = capabilities?.canManageDocuments === true;
  const canManageJobs = capabilities?.canManageJobs === true;
  const canManageCrew = capabilities?.canManageCrew === true;
  const canManageTeam = capabilities?.canManageTeam === true;
  const canAccessOperationsWorkspace =
    canOperate || canManageContent || canReadDocuments;

  const leadsList = useQuery(
    api.leads.list,
    activeOrgId && canOperate
      ? {
          orgId: activeOrgId,
          status: leadStatus === "all" ? undefined : leadStatus,
        }
      : "skip",
  ) as LeadRow[] | undefined;
  const searchedLeads = useQuery(
    api.leads.search,
    activeOrgId && canOperate && searchText.trim().length >= 2
      ? { orgId: activeOrgId, query: searchText.trim() }
      : "skip",
  ) as LeadRow[] | undefined;
  const leads = searchText.trim().length >= 2 ? searchedLeads : leadsList;
  const estimates = useQuery(
    api.estimates.list,
    activeOrgId && canOperate ? { orgId: activeOrgId } : "skip",
  ) as EstimateRow[] | undefined;
  const jobs = useQuery(
    api.jobs.list,
    activeOrgId && capabilities?.canReadJobs
      ? { orgId: activeOrgId }
      : "skip",
  ) as JobRow[] | undefined;
  const customers = useQuery(
    api.customers.list,
    activeOrgId && canOperate ? { orgId: activeOrgId } : "skip",
  ) as CustomerRow[] | undefined;
  const assignableCrew = useQuery(
    api.users.listAssignableCrew,
    activeOrgId && canManageCrew ? { orgId: activeOrgId } : "skip",
  ) as AssignableCrewRow[] | undefined;
  const teamMemberships = useQuery(
    api.users.listTeamMemberships,
    activeOrgId && canManageTeam ? { orgId: activeOrgId } : "skip",
  ) as TeamMembershipRow[] | undefined;
  const claims = useQuery(
    api.claims.list,
    activeOrgId && canManageContent ? { orgId: activeOrgId } : "skip",
  ) as ClaimRow[] | undefined;
  const pages = useQuery(
    api.cms.listPages,
    activeOrgId && canManageContent ? { orgId: activeOrgId } : "skip",
  ) as CmsPageRow[] | undefined;
  const notifications = useQuery(
    api.notifications.listMine,
    activeOrgId && canAccessOperationsWorkspace
      ? { orgId: activeOrgId, limit: 12 }
      : "skip",
  ) as NotificationRow[] | undefined;
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    activeOrgId && canAccessOperationsWorkspace
      ? { orgId: activeOrgId }
      : "skip",
  ) as
    | number
    | undefined;
  const documents = usePaginatedQuery(
    api.files.listDocuments,
    activeOrgId && canReadDocuments
      ? { orgId: activeOrgId, accessLevel: "internal" as const }
      : "skip",
    { initialNumItems: 12 },
  );
  const linkedCustomerUserIds = useMemo(
    () =>
      new Set(
        (customers ?? []).flatMap((customer) =>
          customer.userId ? [customer.userId] : [],
        ),
      ),
    [customers],
  );

  const updateLeadStatus = useMutation(api.leads.updateStatus);
  const createEstimate = useMutation(api.estimates.create);
  const createCustomerFromLead = useMutation(api.customers.createFromLead);
  const createJobFromEstimate = useMutation(api.jobs.createFromEstimate);
  const assignCrew = useMutation(api.jobs.assignCrew);
  const linkCustomerUser = useMutation(api.customers.linkUser);
  const updateMembershipRole = useMutation(api.users.updateRole);
  const updateEstimate = useMutation(api.estimates.update);
  const updateJobStatus = useMutation(api.jobs.updateStatus);
  const updateClaimStatus = useMutation(api.claims.updateStatus);
  const updatePageStatus = useMutation(api.cms.updateStatus);
  const markNotificationRead = useMutation(api.notifications.markAsRead);
  const markAllNotificationsRead = useMutation(
    api.notifications.markAllAsRead,
  );
  const getDownloadUrl = useAction(api.fileActions.getDownloadUrl);

  const exceptions = useMemo(() => {
    const rows: Array<{
      href: string;
      label: string;
      detail: string;
      count: number;
    }> = [];
    const newLeads = leadsList?.filter((lead) => lead.status === "new").length;
    if (newLeads) {
      rows.push({
        href: "#pipeline",
        label: "New leads",
        detail: "Need qualification or an owner",
        count: newLeads,
      });
    }
    const unassignedJobs = jobs?.filter(
      (job) =>
        job.crewIds.length === 0 &&
        job.status !== "completed" &&
        job.status !== "cancelled",
    ).length;
    if (unassignedJobs) {
      rows.push({
        href: "#jobs",
        label: "Unassigned jobs",
        detail: "Scheduled work has no crew",
        count: unassignedJobs,
      });
    }
    const candidateClaims = claims?.filter(
      (claim) => claim.status === "candidate",
    ).length;
    if (candidateClaims) {
      rows.push({
        href: "#claims",
        label: "Proof candidates",
        detail: "Require verification before use",
        count: candidateClaims,
      });
    }
    const reviewPages = pages?.filter(
      (page) => page.status === "in_review",
    ).length;
    if (reviewPages) {
      rows.push({
        href: "#content",
        label: "Content in review",
        detail: "Waiting for an authorized decision",
        count: reviewPages,
      });
    }
    if (unreadCount) {
      rows.push({
        href: "#notifications",
        label: "Unread notifications",
        detail: "Updates awaiting acknowledgement",
        count: unreadCount,
      });
    }
    return rows;
  }, [claims, jobs, leadsList, pages, unreadCount]);

  const sections = [
    canOperate && { href: "#pipeline", label: "Leads" },
    canOperate && { href: "#estimates", label: "Estimates" },
    capabilities?.canReadJobs && { href: "#jobs", label: "Jobs" },
    canOperate && { href: "#customers", label: "Customers" },
    canManageTeam && { href: "#team", label: "Team" },
    canManageContent && { href: "#claims", label: "Proof" },
    canManageContent && { href: "#content", label: "Content" },
    canReadDocuments && { href: "#documents", label: "Documents" },
    { href: "#notifications", label: "Notifications" },
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  async function run(
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ): Promise<boolean> {
    setBusyKey(key);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The action could not be completed. Try again.",
      );
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  async function submitEstimate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estimateDraft || !activeOrgId) return;
    const total = Number(estimateDraft.total);
    if (!estimateDraft.scope.trim() || !Number.isFinite(total) || total < 0) {
      setError("Enter a scope and a valid non-negative estimate total.");
      return;
    }
    const created = await run(
      `estimate-create-${estimateDraft.leadId}`,
      () =>
        createEstimate({
          leadId: estimateDraft.leadId,
          orgId: activeOrgId,
          scope: estimateDraft.scope.trim(),
          pricing: total,
          status: "draft",
        }),
      "Draft estimate created.",
    );
    if (created) setEstimateDraft(null);
  }

  async function createCustomer(leadId: Id<"leads">) {
    await run(
      `customer-create-${leadId}`,
      () => createCustomerFromLead({ leadId }),
      "Customer and primary property created.",
    );
  }

  async function submitJobSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!jobDraft) return;
    const startsAt = new Date(jobDraft.startsAt).getTime();
    if (!jobDraft.startsAt || !Number.isFinite(startsAt)) {
      setError("Choose a valid start date and time for this job.");
      return;
    }
    const created = await run(
      `job-create-${jobDraft.estimateId}`,
      () =>
        createJobFromEstimate({
          estimateId: jobDraft.estimateId,
          schedule: startsAt,
          status: "scheduled",
        }),
      "Job scheduled from the accepted estimate.",
    );
    if (created) setJobDraft(null);
  }

  async function submitCrewAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!crewDraft) return;
    const assigned = await run(
      `crew-${crewDraft.jobId}`,
      () =>
        assignCrew({
          jobId: crewDraft.jobId,
          crewIds: crewDraft.crewIds,
        }),
      crewDraft.crewIds.length === 0
        ? "Crew assignments cleared."
        : "Crew assignments updated.",
    );
    if (assigned) setCrewDraft(null);
  }

  async function submitCustomerLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerLinkDraft?.userId) {
      setError("Choose an active customer membership to link.");
      return;
    }
    const linked = await run(
      `customer-link-${customerLinkDraft.customerId}`,
      () =>
        linkCustomerUser({
          customerId: customerLinkDraft.customerId,
          userId: customerLinkDraft.userId as Id<"users">,
        }),
      "Customer portal access linked to the verified membership.",
    );
    if (linked) setCustomerLinkDraft(null);
  }

  async function changeMembershipRole(
    member: TeamMembershipRow,
    nextRole: AppRole,
  ) {
    if (!activeOrgId) {
      setError("Select an active organization before changing a role.");
      return;
    }
    setRoleDrafts((current) => ({ ...current, [member.userId]: nextRole }));
    const updated = await run(
      `role-${member.userId}`,
      () =>
        updateMembershipRole({
          userId: member.userId,
          orgId: activeOrgId,
          role: nextRole,
        }),
      `Application role updated for ${member.name}.`,
    );
    if (updated) {
      setRoleDrafts((current) => {
        const next = { ...current };
        delete next[member.userId];
        return next;
      });
    }
  }

  if (workspace?.context === undefined) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card px-5 py-10 text-sm text-muted-foreground" aria-busy="true" aria-live="polite">
        Loading your secure workspace…
      </div>
    );
  }

  if (!activeOrgId) {
    return (
      <EmptyState>
        Select an active organization before opening operational records.
      </EmptyState>
    );
  }

  if (capabilities === undefined) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card px-5 py-10 text-sm text-muted-foreground" aria-live="polite">
        Loading your organization capabilities…
      </div>
    );
  }

  if (!canAccessOperationsWorkspace) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-bold">Operations workspace is not available for this role</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This organization membership does not grant an operations capability.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8" data-testid="operations-dashboard">
      <nav
        className="-mx-4 flex gap-1 overflow-x-auto border-y border-border bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border lg:sticky lg:top-[65px] lg:z-30"
        aria-label="Operations sections"
      >
        {sections.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {section.label}
          </a>
        ))}
      </nav>

      {error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div role="status" className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium">
          {notice}
        </div>
      ) : null}

      <MotionReveal direction="up">
        <section aria-labelledby="exceptions-heading" className="rounded-xl bg-foreground p-5 text-background sm:p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-primary" aria-hidden="true" />
            <h2 id="exceptions-heading" className="text-xl font-bold tracking-tight">
              Work the exceptions first
            </h2>
          </div>
          {exceptions.length === 0 ? (
            <div className="mt-5 flex items-center gap-3 border-t border-background/20 pt-5 text-sm text-background/80">
              <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
              No loaded record currently requires an exception response.
            </div>
          ) : (
            <div className="mt-5 divide-y divide-background/20 border-t border-background/20">
              {exceptions.map((item) => (
                <a key={item.href} href={item.href} className="flex items-center gap-4 py-4 text-left hover:text-primary">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-sm font-extrabold text-foreground">
                    {item.count}
                  </span>
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="block text-sm text-background/65">{item.detail}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>
      </MotionReveal>

      {canOperate ? (
        <Section id="pipeline" title="Lead pipeline" description="Search the live intake record, qualify the next request, and open a draft estimate without leaving the queue.">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search leads</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search name, address, email, or phone" className="pl-9" />
            </label>
            <label>
              <span className="sr-only">Lead status</span>
              <select value={leadStatus} onChange={(event) => setLeadStatus(event.target.value as "all" | LeadStatus)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44">
                <option value="all">All statuses</option>
                {(["new", "contacted", "qualified", "scheduled", "closed", "lost"] as LeadStatus[]).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
            </label>
          </div>
          {leads === undefined ? <EmptyState>Loading lead records…</EmptyState> : leads.length === 0 ? <EmptyState>No leads match this view.</EmptyState> : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {leads.map((lead) => (
                <div key={lead._id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{lead.fullName}</h3>
                        <Badge variant="outline" className="capitalize">{lead.segment}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{lead.serviceAddress || "Service address pending"}</p>
                      <p className="mt-2 text-sm"><a className="font-medium hover:text-primary" href={`mailto:${lead.email}`}>{lead.email}</a><span className="px-2 text-muted-foreground">·</span><a className="font-medium hover:text-primary" href={`tel:${lead.phone}`}>{lead.phone}</a></p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select aria-label={`Status for ${lead.fullName}`} value={lead.status} disabled={busyKey === `lead-${lead._id}`} onChange={(event) => void run(`lead-${lead._id}`, () => updateLeadStatus({ leadId: lead._id, status: event.target.value as LeadStatus }), "Lead status updated.")} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {(["new", "contacted", "qualified", "scheduled", "closed", "lost"] as LeadStatus[]).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                      </select>
                      {lead.customerId ? (
                        <Badge variant="outline">Customer ready</Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busyKey === `customer-create-${lead._id}`}
                          onClick={() => void createCustomer(lead._id)}
                        >
                          Create customer
                        </Button>
                      )}
                      <Button type="button" variant="outline" onClick={() => setEstimateDraft({ leadId: lead._id, scope: "", total: "" })}>Draft estimate</Button>
                    </div>
                  </div>
                  {estimateDraft?.leadId === lead._id ? (
                    <form onSubmit={submitEstimate} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_10rem_auto]">
                      <Input aria-label="Estimate scope" placeholder="Scope of work" value={estimateDraft.scope} onChange={(event) => setEstimateDraft({ ...estimateDraft, scope: event.target.value })} />
                      <Input aria-label="Estimate total" inputMode="decimal" placeholder="Total" value={estimateDraft.total} onChange={(event) => setEstimateDraft({ ...estimateDraft, total: event.target.value })} />
                      <div className="flex gap-2"><Button type="submit" disabled={busyKey === `estimate-create-${lead._id}`}>Create draft</Button><Button type="button" variant="ghost" onClick={() => setEstimateDraft(null)}>Cancel</Button></div>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {canOperate ? (
        <Section id="estimates" title="Estimates" description="Move proposals through their real lifecycle; totals and scope come directly from the estimate record.">
          {estimates === undefined ? <EmptyState>Loading estimates…</EmptyState> : estimates.length === 0 ? <EmptyState>No estimates are recorded for this organization.</EmptyState> : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {estimates.map((estimate) => {
                const matchingJob = jobs?.find(
                  (job) => job.estimateId === estimate._id,
                );
                return (
                  <article key={estimate._id} className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{estimate.scope}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatMoney(estimate.pricing)} · Created{" "}
                          {new Date(estimate.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label={`Status for ${estimate.scope}`}
                          value={estimate.status}
                          disabled={busyKey === `estimate-${estimate._id}`}
                          onChange={(event) =>
                            void run(
                              `estimate-${estimate._id}`,
                              () =>
                                updateEstimate({
                                  estimateId: estimate._id,
                                  status: event.target.value as EstimateStatus,
                                }),
                              "Estimate status updated.",
                            )
                          }
                          className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {(
                            [
                              "draft",
                              "sent",
                              "accepted",
                              "declined",
                              "expired",
                            ] as EstimateStatus[]
                          ).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        {canManageJobs ? (
                          jobs === undefined ? (
                            <span className="text-sm text-muted-foreground">
                              Checking job link…
                            </span>
                          ) : matchingJob ? (
                            <Badge variant="outline">Job scheduled</Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setJobDraft({
                                  estimateId: estimate._id,
                                  startsAt: "",
                                })
                              }
                            >
                              Schedule job
                            </Button>
                          )
                        ) : null}
                      </div>
                    </div>
                    {jobDraft?.estimateId === estimate._id ? (
                      <form
                        onSubmit={submitJobSchedule}
                        className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end"
                      >
                        <label className="flex-1 text-sm font-semibold">
                          Job start
                          <Input
                            type="datetime-local"
                            required
                            value={jobDraft.startsAt}
                            onChange={(event) =>
                              setJobDraft({
                                ...jobDraft,
                                startsAt: event.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={
                              busyKey === `job-create-${estimate._id}`
                            }
                          >
                            Confirm schedule
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setJobDraft(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </Section>
      ) : null}

      {capabilities.canReadJobs ? (
        <Section id="jobs" title="Jobs and schedule" description="See field readiness at a glance and advance job status only when your organization role allows it.">
          {jobs === undefined ? <EmptyState>Loading jobs…</EmptyState> : jobs.length === 0 ? <EmptyState>No jobs are scheduled.</EmptyState> : (
            <div className="grid gap-3 lg:grid-cols-2">
              {jobs.map((job) => (
                <article
                  key={job._id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <BriefcaseBusiness
                      className="mt-0.5 size-5 text-primary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {job.title ?? job.address ?? "Assigned job"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatSchedule(job.schedule)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        job.crewIds.length === 0 ? "destructive" : "outline"
                      }
                    >
                      {job.crewIds.length === 0
                        ? "Crew needed"
                        : `${job.crewIds.length} assigned`}
                    </Badge>
                  </div>
                  {capabilities.canUpdateJobs ? (
                    <select
                      aria-label={`Status for job ${job._id}`}
                      value={job.status}
                      disabled={busyKey === `job-${job._id}`}
                      onChange={(event) =>
                        void run(
                          `job-${job._id}`,
                          () =>
                            updateJobStatus({
                              jobId: job._id,
                              status: event.target.value as JobStatus,
                            }),
                          "Job status updated.",
                        )
                      }
                      className="mt-4 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {(
                        [
                          "scheduled",
                          "in_progress",
                          "completed",
                          "cancelled",
                        ] as JobStatus[]
                      ).map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {canManageCrew ? (
                    <div className="mt-3 border-t border-border pt-3">
                      {crewDraft?.jobId === job._id ? (
                        <form onSubmit={submitCrewAssignment}>
                          <fieldset>
                            <legend className="text-sm font-bold">
                              Assigned crew
                            </legend>
                            {assignableCrew === undefined ? (
                              <p
                                className="mt-2 text-sm text-muted-foreground"
                                aria-live="polite"
                              >
                                Loading active crew…
                              </p>
                            ) : assignableCrew.length === 0 ? (
                              <p className="mt-2 text-sm text-muted-foreground">
                                No active crew memberships are available.
                              </p>
                            ) : (
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {assignableCrew.map((crew) => {
                                  const checked = crewDraft.crewIds.includes(
                                    crew.userId,
                                  );
                                  return (
                                    <label
                                      key={crew.userId}
                                      className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) =>
                                          setCrewDraft({
                                            ...crewDraft,
                                            crewIds: event.target.checked
                                              ? [
                                                  ...crewDraft.crewIds,
                                                  crew.userId,
                                                ]
                                              : crewDraft.crewIds.filter(
                                                  (userId) =>
                                                    userId !== crew.userId,
                                                ),
                                          })
                                        }
                                        className="size-4 accent-primary"
                                      />
                                      <span className="min-w-0">
                                        <span className="block truncate font-semibold">
                                          {crew.name}
                                        </span>
                                        <span className="block capitalize text-muted-foreground">
                                          {crew.role.replaceAll("_", " ")}
                                        </span>
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </fieldset>
                          <div className="mt-3 flex gap-2">
                            <Button
                              type="submit"
                              disabled={busyKey === `crew-${job._id}`}
                            >
                              Save crew
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setCrewDraft(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            setCrewDraft({
                              jobId: job._id,
                              crewIds: [...job.crewIds],
                            })
                          }
                        >
                          Manage crew
                        </Button>
                      )}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {canOperate ? (
        <Section id="customers" title="Customers" description="Create the operational record first, then explicitly bind portal access to an active customer membership. Email addresses never establish ownership.">
          {customers === undefined ? (
            <EmptyState>Loading customer records…</EmptyState>
          ) : customers.length === 0 ? (
            <EmptyState>No customers are linked to this organization.</EmptyState>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {customers.map((customer) => {
                const eligibleMemberships = (teamMemberships ?? []).filter(
                  (member) =>
                    member.role === "customer" &&
                    member.status === "active" &&
                    (!linkedCustomerUserIds.has(member.userId) ||
                      member.userId === customer.userId),
                );
                return (
                  <div key={customer._id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Users
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold">{customer.name}</p>
                        <a
                          href={`mailto:${customer.email}`}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {customer.email}
                        </a>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                        {customer.status ? (
                          <Badge variant="outline" className="w-fit capitalize">
                            {customer.status}
                          </Badge>
                        ) : null}
                        {customer.userId ? (
                          <Badge variant="outline">Portal linked</Badge>
                        ) : canManageTeam ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setCustomerLinkDraft({
                                customerId: customer._id,
                                userId: "",
                              })
                            }
                          >
                            Link portal access
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {customerLinkDraft?.customerId === customer._id ? (
                      <form
                        onSubmit={submitCustomerLink}
                        className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end"
                      >
                        <label className="flex-1 text-sm font-semibold">
                          Active customer membership
                          <select
                            required
                            value={customerLinkDraft.userId}
                            onChange={(event) =>
                              setCustomerLinkDraft({
                                ...customerLinkDraft,
                                userId: event.target.value,
                              })
                            }
                            className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Choose membership</option>
                            {eligibleMemberships.map((member) => (
                              <option key={member.membershipId} value={member.userId}>
                                {member.name} · {member.email}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={
                              busyKey === `customer-link-${customer._id}` ||
                              eligibleMemberships.length === 0
                            }
                          >
                            Confirm link
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setCustomerLinkDraft(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                        {teamMemberships !== undefined &&
                        eligibleMemberships.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No unlinked active customer membership is available.
                          </p>
                        ) : null}
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      ) : null}

      {canManageTeam ? (
        <Section
          id="team"
          title="Team roles"
          description="Application authorization is organization-scoped and audited. WorkOS remains the source of identity and membership lifecycle."
        >
          {teamMemberships === undefined ? (
            <EmptyState>Loading team memberships…</EmptyState>
          ) : teamMemberships.length === 0 ? (
            <EmptyState>No active or invited memberships are available.</EmptyState>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {teamMemberships.map((member) => {
                const actorIsOwner = role === "owner";
                const roleOptions = actorIsOwner
                  ? ROLE_OPTIONS
                  : ROLE_OPTIONS.filter(
                      (option) =>
                        option.value !== "owner" && option.value !== "admin",
                    );
                const currentRole = roleDrafts[member.userId] ?? member.role;
                const cannotAdministerOwner =
                  !actorIsOwner && member.role === "owner";
                const hasCurrentOption = roleOptions.some(
                  (option) => option.value === currentRole,
                );
                return (
                  <div
                    key={member.membershipId}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{member.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {member.email}
                      </p>
                      {member.workosRoleSlug ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          WorkOS role: {member.workosRoleSlug}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className="w-fit capitalize">
                      {member.status}
                    </Badge>
                    {cannotAdministerOwner ? (
                      <Badge variant="outline">Owner managed</Badge>
                    ) : (
                      <label className="text-sm font-semibold">
                        <span className="sr-only">
                          Application role for {member.name}
                        </span>
                        <select
                          value={currentRole}
                          disabled={busyKey === `role-${member.userId}`}
                          onChange={(event) =>
                            void changeMembershipRole(
                              member,
                              event.target.value as AppRole,
                            )
                          }
                          className="h-10 min-w-48 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {!hasCurrentOption ? (
                            <option value={currentRole} disabled>
                              {currentRole.replaceAll("_", " ")}
                            </option>
                          ) : null}
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      ) : null}

      {canManageContent ? (
        <Section
          id="claims"
          title="Proof governance"
          description="Candidate proof remains blocked until an authorized reviewer records a verified or rejected decision."
        >
          {claims === undefined ? (
            <EmptyState>Loading proof claims…</EmptyState>
          ) : claims.length === 0 ? (
            <EmptyState>No proof claims require review.</EmptyState>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {claims.map((claim) => (
                <div
                  key={claim._id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <FileCheck2 className="size-5 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{claim.text}</p>
                    <p className="text-sm text-muted-foreground">{claim.claimKey}</p>
                  </div>
                  {canApproveContent ? (
                    <select
                      aria-label={`Verification status for ${claim.claimKey}`}
                      value={claim.status}
                      disabled={busyKey === `claim-${claim._id}`}
                      onChange={(event) =>
                        void run(
                          `claim-${claim._id}`,
                          () =>
                            updateClaimStatus({
                              claimId: claim._id,
                              status: event.target.value as ClaimStatus,
                            }),
                          "Proof decision recorded.",
                        )
                      }
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {(["candidate", "verified", "rejected"] as ClaimStatus[]).map(
                        (value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                  ) : (
                    <Badge variant="outline" className="w-fit capitalize">
                      {claim.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {canManageContent ? (
        <Section
          id="content"
          title="Content publication"
          description="Draft, review, publication, and archive state are recorded against the authenticated editor."
        >
          {pages === undefined ? (
            <EmptyState>Loading CMS pages…</EmptyState>
          ) : pages.length === 0 ? (
            <EmptyState>No CMS pages are available for this organization.</EmptyState>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {pages.map((page) => {
                const editableStatuses: PageStatus[] = canApproveContent
                  ? ["draft", "in_review", "published", "archived"]
                  : ["draft", "in_review", "archived"];
                const canChangeStatus = canApproveContent || page.status !== "published";
                return (
                  <div
                    key={page._id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <FileText className="size-5 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{page.title}</p>
                      <p className="truncate text-sm text-muted-foreground">/{page.slug}</p>
                    </div>
                    {canChangeStatus ? (
                      <select
                        aria-label={`Publication status for ${page.title}`}
                        value={page.status}
                        disabled={busyKey === `page-${page._id}`}
                        onChange={(event) =>
                          void run(
                            `page-${page._id}`,
                            () =>
                              updatePageStatus({
                                pageId: page._id,
                                status: event.target.value as PageStatus,
                              }),
                            "Publication state updated.",
                          )
                        }
                        className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {editableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="outline" className="w-fit capitalize">
                        {page.status}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      ) : null}

      {canReadDocuments ? (
        <Section id="documents" title="Internal documents" description="File bytes remain in Vercel Blob; this list is authorized Convex metadata with short-lived downloads.">
          {documents.status === "LoadingFirstPage" ? <EmptyState>Loading document metadata…</EmptyState> : documents.results.length === 0 ? <EmptyState>No internal documents are available.</EmptyState> : <div className="divide-y divide-border rounded-xl border border-border bg-card">{(documents.results as DocumentRow[]).map((document) => <div key={document._id} className="flex items-center gap-3 p-4"><FileText className="size-5 text-primary" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{document.name}</p><p className="text-xs text-muted-foreground">{document.mimeType} · {Math.max(1, Math.round(document.size / 1024))} KB</p></div><Button type="button" variant="outline" size="sm" disabled={busyKey === `document-${document._id}`} onClick={() => void run(`document-${document._id}`, async () => { const result = await getDownloadUrl({ documentId: document._id }); window.location.assign(result.url); }, "Download authorized.")}><ArrowDownToLine className="mr-2 size-4" />Download</Button></div>)}{documents.status === "CanLoadMore" ? <div className="p-4"><Button type="button" variant="outline" onClick={() => documents.loadMore(12)}>Load more</Button></div> : null}</div>}
        </Section>
      ) : null}

      <Section id="notifications" title="Notifications" description="Only notifications addressed to the authenticated user appear here.">
        <div className="mb-4 flex items-center justify-between gap-4"><p className="flex items-center gap-2 text-sm font-semibold"><Bell className="size-4 text-primary" />{typeof unreadCount === "number" ? `${unreadCount} unread` : "Checking unread notifications"}</p><Button type="button" variant="outline" size="sm" disabled={!unreadCount || busyKey === "notifications-all"} onClick={() => void run("notifications-all", () => markAllNotificationsRead({ orgId: activeOrgId }), "All notifications marked read.")}>Mark all read</Button></div>
        {notifications === undefined ? <EmptyState>Loading notifications…</EmptyState> : notifications.length === 0 ? <EmptyState>No notifications are waiting.</EmptyState> : <div className="divide-y divide-border rounded-xl border border-border bg-card">{notifications.map((notification) => { const isRead = notification.isRead ?? notification.read ?? false; return <button key={notification._id} type="button" disabled={isRead || busyKey === `notification-${notification._id}`} onClick={() => void run(`notification-${notification._id}`, () => markNotificationRead({ notificationId: notification._id }), "Notification marked read.")} className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/60 disabled:cursor-default disabled:hover:bg-transparent"><span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${isRead ? "bg-muted-foreground/25" : "bg-primary"}`} /><span className="min-w-0 flex-1"><span className="block font-semibold">{notification.title}</span><span className="mt-1 block text-sm text-muted-foreground">{notification.body ?? notification.message ?? "Open notification"}</span></span>{isRead ? <Badge variant="outline">Read</Badge> : <Badge>Unread</Badge>}</button>; })}</div>}
      </Section>
    </div>
  );
}
