import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  pathname: "/operations",
  context: undefined as
    | undefined
    | {
        user: { _id: string; name: string; email: string };
        memberships: Array<{
          membershipId: string;
          orgId: string;
          role: string;
          organization: {
            _id: string;
            name: string;
            slug: string;
            status: string;
          };
        }>;
        defaultOrgId: string | null;
      },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
}));

vi.mock("convex/react", () => ({
  useQuery: () => state.context,
}));

import { PortalShell } from "@/components/portal/PortalShell";

function contextFor(role: string) {
  return {
    user: { _id: "user_1", name: "Pat", email: "pat@example.test" },
    memberships: [
      {
        membershipId: "membership_1",
        orgId: "organization_1",
        role,
        organization: {
          _id: "organization_1",
          name: "Sky Test",
          slug: "sky-test",
          status: "active",
        },
      },
    ],
    defaultOrgId: "organization_1",
  };
}

function renderShell() {
  return renderToStaticMarkup(
    <PortalShell
      serverUser={{ name: "Pat", email: "pat@example.test" }}
      signOutAction={async () => {}}
    >
      <p>protected route child</p>
    </PortalShell>,
  );
}

describe("portal route capability guard", () => {
  beforeEach(() => {
    state.pathname = "/operations";
    state.context = undefined;
  });

  it("does not mount route children before Convex membership verification", () => {
    const html = renderShell();
    expect(html).toContain("Verifying your organization membership");
    expect(html).not.toContain("protected route child");
  });

  it("denies an assigned crew member who navigates directly to operations", () => {
    state.context = contextFor("crew_member");
    const html = renderShell();
    expect(html).toContain("not available for your role");
    expect(html).toContain("Open Crew");
    expect(html).not.toContain("protected route child");
  });

  it("allows an operations role on the operations route", () => {
    state.context = contextFor("estimator");
    expect(renderShell()).toContain("protected route child");
  });

  it("keeps customer membership on the exact customer route", () => {
    state.pathname = "/customer";
    state.context = contextFor("customer");
    expect(renderShell()).toContain("protected route child");

    state.pathname = "/crew";
    const denied = renderShell();
    expect(denied).toContain("not available for your role");
    expect(denied).not.toContain("protected route child");
  });
});
