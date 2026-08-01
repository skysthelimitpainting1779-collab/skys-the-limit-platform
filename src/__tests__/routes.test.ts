import { describe, it, expect } from "vitest";

import Home, { metadata as homeMeta } from "@/app/page";
import ResidentialPage, { metadata as resMeta } from "@/app/residential/page";
import CommercialPage, { metadata as commMeta } from "@/app/commercial/page";
import PublicSectorPage, { metadata as pubMeta } from "@/app/public-sector/page";
import EstimatePage, { metadata as estMeta } from "@/app/estimate/page";
import CustomerPage, { metadata as custMeta } from "@/app/customer/page";
import CrewPage, { metadata as crewMeta } from "@/app/crew/page";
import OperationsPage, { metadata as opsMeta } from "@/app/operations/page";

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

    for (const r of routes) {
      expect(typeof r.page).toBe("function");
      expect(r.meta).toBeDefined();
      expect(r.meta.title).toContain(r.titlePart);
      expect(r.meta.description).toBeDefined();
    }
  });
});
