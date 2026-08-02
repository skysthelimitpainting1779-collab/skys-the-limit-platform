import { describe, it, expect, vi } from "vitest";

vi.mock("@workos-inc/authkit-nextjs", () => ({
  getSignInUrl: vi.fn(),
  getSignUpUrl: vi.fn(),
  withAuth: vi.fn(),
}));

import Home, { metadata as homeMeta } from "@/app/page";
import ResidentialPage, { metadata as resMeta } from "@/app/residential/page";
import CommercialPage, { metadata as commMeta } from "@/app/commercial/page";
import PublicSectorPage, { metadata as pubMeta } from "@/app/public-sector/page";
import EstimatePage, { metadata as estMeta } from "@/app/estimate/page";
import CustomerPage from "@/app/customer/page";
import CrewPage from "@/app/crew/page";
import OperationsPage from "@/app/operations/page";
import { metadata as custMeta } from "@/app/customer/layout";
import { metadata as crewMeta } from "@/app/crew/layout";
import { metadata as opsMeta } from "@/app/operations/layout";

describe("App Router Route Shells Suite", () => {
  it("verifies all 8 routes export valid page components and metadata", () => {
    const routes = [
      { page: Home, meta: homeMeta, titlePart: "Sky's the Limit" },
      { page: ResidentialPage, meta: resMeta, titlePart: "Residential" },
      { page: CommercialPage, meta: commMeta, titlePart: "Commercial" },
      { page: PublicSectorPage, meta: pubMeta, titlePart: "Public Sector" },
      { page: EstimatePage, meta: estMeta, titlePart: "Estimate" },
      { page: CustomerPage, meta: custMeta, titlePart: "Customer" },
      { page: CrewPage, meta: crewMeta, titlePart: "Crew" },
      { page: OperationsPage, meta: opsMeta, titlePart: "Operations" },
    ];

    expect(routes.length).toBe(8);

    for (const route of routes) {
      expect(typeof route.page).toBe("function");
      expect(route.meta).toBeDefined();
      expect(route.meta.title).toContain(route.titlePart);
      expect(route.meta.description).toBeDefined();
    }
  });
});
