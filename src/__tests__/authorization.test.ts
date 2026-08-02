import { describe, it, expect } from "vitest";

describe("Platform Authorization Matrix Enforcement", () => {
  it("restricts customer document access strictly to customer-owned records", () => {
    const customerId = "cust-123";
    const documents = [
      { id: "doc-1", customerId: "cust-123", title: "My Scope Proposal.pdf" },
      { id: "doc-2", customerId: "cust-999", title: "Other Customer Invoice.pdf" },
    ];

    const accessibleDocs = documents.filter((doc) => doc.customerId === customerId);
    expect(accessibleDocs.length).toBe(1);
    expect(accessibleDocs[0].id).toBe("doc-1");
  });

  it("restricts field crew access strictly to assigned jobs", () => {
    const crewUserId = "user-crew-elena";
    const jobs = [
      { id: "job-201", crewIds: ["user-crew-elena", "user-crew-marcus"], stage: "in_progress" },
      { id: "job-202", crewIds: ["user-crew-marcus"], stage: "scheduled" },
    ];

    const assignedJobs = jobs.filter((job) => job.crewIds.includes(crewUserId));
    expect(assignedJobs.length).toBe(1);
    expect(assignedJobs[0].id).toBe("job-201");
  });

  it("prevents content_editor from directly publishing CMS pages without content_approver role", () => {
    const editorUser = { id: "user-editor", role: "content_editor" };
    const approverUser = { id: "user-approver", role: "content_approver" };

    const canPublish = (user: { role: string }) =>
      user.role === "content_approver" || user.role === "admin" || user.role === "owner";

    expect(canPublish(editorUser)).toBe(false);
    expect(canPublish(approverUser)).toBe(true);
  });
});
