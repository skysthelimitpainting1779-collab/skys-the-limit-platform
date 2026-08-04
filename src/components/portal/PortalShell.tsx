"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  Building2,
  ChevronDown,
  ClipboardCheck,
  HardHat,
  LayoutDashboard,
  LogOut,
  Paintbrush,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";

type MembershipRole =
  | "owner"
  | "admin"
  | "estimator"
  | "project_manager"
  | "content_editor"
  | "content_approver"
  | "crew_lead"
  | "crew_member"
  | "crew"
  | "staff"
  | "customer"
  | "member";

type PortalContextResult = {
  user: {
    _id: Id<"users">;
    name: string;
    email: string;
    avatarUrl?: string;
    identityStatus?: string;
  };
  memberships: Array<{
    membershipId: Id<"memberships">;
    orgId: Id<"organizations">;
    role: MembershipRole;
    organization: {
      _id: Id<"organizations">;
      name: string;
      slug: string;
      status: string;
    };
  }>;
  defaultOrgId: Id<"organizations"> | null;
};

type WorkspaceValue = {
  context: PortalContextResult | undefined;
  selectedOrgId: Id<"organizations"> | null;
  setSelectedOrgId: (orgId: Id<"organizations">) => void;
  activeMembership: PortalContextResult["memberships"][number] | null;
};

const PortalWorkspaceContext = createContext<WorkspaceValue | null>(null);

export function usePortalWorkspace() {
  return useContext(PortalWorkspaceContext);
}

const OPERATIONS_ROLES = new Set<MembershipRole>([
  "owner",
  "admin",
  "estimator",
  "project_manager",
  "content_editor",
  "content_approver",
  "staff",
]);

const CREW_ROLES = new Set<MembershipRole>([
  "owner",
  "admin",
  "project_manager",
  "crew_lead",
  "crew_member",
  "crew",
]);

const CUSTOMER_ROLES = new Set<MembershipRole>(["customer"]);

const portalNav = [
  {
    href: "/operations",
    label: "Operations",
    icon: LayoutDashboard,
    allows: OPERATIONS_ROLES,
  },
  { href: "/crew", label: "Crew", icon: HardHat, allows: CREW_ROLES },
  {
    href: "/customer",
    label: "Customer record",
    icon: ClipboardCheck,
    allows: CUSTOMER_ROLES,
  },
];

export function PortalShell({
  children,
  serverUser,
  signOutAction,
}: {
  children: ReactNode;
  serverUser: { name: string; email: string; avatarUrl?: string };
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const context = useQuery(api.users.getMyContext, {}) as
    | PortalContextResult
    | undefined;
  const [requestedOrgId, setSelectedOrgIdState] =
    useState<Id<"organizations"> | null>(null);

  const selectedOrgId = useMemo(() => {
    if (!context) return requestedOrgId;
    const stillAvailable = context.memberships.some(
      (membership) => membership.orgId === requestedOrgId,
    );
    return stillAvailable
      ? requestedOrgId
      : (context.defaultOrgId ?? context.memberships.at(0)?.orgId ?? null);
  }, [context, requestedOrgId]);

  const activeMembership = useMemo(
    () =>
      context?.memberships.find(
        (membership) => membership.orgId === selectedOrgId,
      ) ?? null,
    [context, selectedOrgId],
  );
  const role = activeMembership?.role;
  const visibleNav = role
    ? portalNav.filter((item) => item.allows.has(role))
    : portalNav.filter((item) => pathname.startsWith(item.href));
  const displayUser = context?.user ?? serverUser;

  const workspaceValue = useMemo<WorkspaceValue>(
    () => ({
      context,
      selectedOrgId,
      setSelectedOrgId: setSelectedOrgIdState,
      activeMembership,
    }),
    [activeMembership, context, selectedOrgId],
  );

  return (
    <PortalWorkspaceContext.Provider value={workspaceValue}>
      <div className="min-h-screen bg-muted/35 text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
          <div className="mx-auto flex max-w-[96rem] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href={visibleNav.at(0)?.href ?? "/"}
              className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Sky's the Limit workspace"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <Paintbrush className="size-5 text-primary" aria-hidden="true" />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-extrabold tracking-tight">
                  Sky&apos;s Operations
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {activeMembership?.organization.name ?? "Secure workspace"}
                </span>
              </span>
            </Link>

            <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Workspace">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              {context && context.memberships.length > 1 ? (
                <label className="relative hidden sm:block">
                  <span className="sr-only">Active organization</span>
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={selectedOrgId ?? ""}
                    onChange={(event) =>
                      setSelectedOrgIdState(
                        event.target.value as Id<"organizations">,
                      )
                    }
                    className="h-10 max-w-52 appearance-none rounded-lg border border-border bg-card pl-9 pr-8 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {context.memberships.map((membership) => (
                      <option key={membership.membershipId} value={membership.orgId}>
                        {membership.organization.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </label>
              ) : null}

              {role ? (
                <Badge variant="outline" className="hidden capitalize md:inline-flex">
                  <ShieldCheck className="mr-1 size-3.5" aria-hidden="true" />
                  {role.replaceAll("_", " ")}
                </Badge>
              ) : null}

              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-44 truncate text-sm font-semibold">
                  {displayUser.name}
                </p>
                <p className="max-w-44 truncate text-xs text-muted-foreground">
                  {displayUser.email}
                </p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden" aria-label="Workspace">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {context && context.memberships.length === 0 ? (
          <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <section className="rounded-xl border border-border bg-card p-6">
              <h1 className="text-2xl font-bold tracking-tight">
                An organization invitation is required
              </h1>
              <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
                Your WorkOS session is valid, but no active organization
                membership is available. Ask an owner or administrator to
                complete the invitation before using operational records.
              </p>
            </section>
          </main>
        ) : (
          children
        )}
      </div>
    </PortalWorkspaceContext.Provider>
  );
}
