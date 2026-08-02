import { describe, expect, it } from "vitest";
import {
  assertAllowedRole,
  assertCrewAssignment,
  assertCustomerOwnership,
  type AppRole,
} from "../../convex/lib/authorization";

describe("portal authorization invariants", () => {
  it("rejects users whose application role is not explicitly allowed", () => {
    expect(() =>
      assertAllowedRole("customer", ["owner", "admin", "project_manager"]),
    ).toThrow("FORBIDDEN");

    expect(() =>
      assertAllowedRole("project_manager", [
        "owner",
        "admin",
        "project_manager",
      ]),
    ).not.toThrow();
  });

  it("rejects cross-customer record access", () => {
    expect(() =>
      assertCustomerOwnership("user_customer_a", "user_customer_b"),
    ).toThrow("FORBIDDEN");

    expect(() =>
      assertCustomerOwnership("user_customer_a", "user_customer_a"),
    ).not.toThrow();
  });

  it("allows a crew member only on assigned jobs unless an operations role is present", () => {
    const crewIds = ["user_crew_a", "user_crew_b"];

    expect(() =>
      assertCrewAssignment(crewIds, "user_crew_c", "crew_member"),
    ).toThrow("FORBIDDEN");

    expect(() =>
      assertCrewAssignment(crewIds, "user_crew_a", "crew_member"),
    ).not.toThrow();

    for (const role of ["owner", "admin", "project_manager"] as AppRole[]) {
      expect(() =>
        assertCrewAssignment(crewIds, "user_ops", role),
      ).not.toThrow();
    }
  });

  it("does not treat an unknown role as authorized", () => {
    expect(() =>
      assertAllowedRole(null, ["owner", "admin"]),
    ).toThrow("FORBIDDEN");
  });
});
