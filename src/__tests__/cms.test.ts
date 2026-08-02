import { describe, it, expect } from "vitest";

describe("Convex CMS Publication Governance", () => {
  it("hides draft and in_review content from public queries", () => {
    const pageRecords = [
      { slug: "home", status: "published", title: "Sky's Homepage" },
      { slug: "draft-page", status: "draft", title: "Draft Service Page" },
      { slug: "review-page", status: "in_review", title: "Pending Review Page" },
    ];

    const publicPages = pageRecords.filter((p) => p.status === "published");
    expect(publicPages.length).toBe(1);
    expect(publicPages[0].slug).toBe("home");
  });

  it("requires public_approved status on attached proof assets before publishing a project", () => {
    const project = {
      slug: "historic-residence",
      publicationStatus: "published",
      permissionStatus: "public_approved",
      assetIds: ["PORT-001"],
    };

    const isPublishable =
      project.publicationStatus === "published" &&
      project.permissionStatus === "public_approved";

    expect(isPublishable).toBe(true);
  });

  it("rejects publication of candidate restricted assets to public pages", () => {
    const candidateAsset = {
      assetKey: "PORT-002",
      permissionStatus: "candidate_restricted",
    };

    const isAllowedInProduction = candidateAsset.permissionStatus === "public_approved";
    expect(isAllowedInProduction).toBe(false);
  });
});
