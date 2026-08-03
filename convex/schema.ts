import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const projectType = v.union(
  v.literal("residential"),
  v.literal("commercial"),
  v.literal("public-sector"),
);

const userRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("estimator"),
  v.literal("project_manager"),
  v.literal("crew_lead"),
  v.literal("crew_member"),
  v.literal("crew"),
  v.literal("staff"),
  v.literal("customer"),
  v.literal("content_editor"),
  v.literal("content_approver"),
);

const membershipRole = v.union(
  userRole,
  // Backfill-safe legacy value. It receives no protected capability.
  v.literal("member"),
);

const documentAccessLevel = v.union(
  v.literal("public"),
  v.literal("internal"),
  v.literal("restricted"),
);

const checklistStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
);

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    tokenIdentifier: v.optional(v.string()),
    identitySource: v.optional(v.literal("workos_webhook")),
    identityStatus: v.optional(
      v.union(v.literal("active"), v.literal("disabled")),
    ),
    email: v.string(),
    role: userRole,
    name: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    ),
    settings: v.optional(v.record(v.string(), v.any())),
  }).index("by_slug", ["slug"]),

  memberships: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: membershipRole,
    status: v.union(
      v.literal("active"),
      v.literal("invited"),
      v.literal("disabled"),
    ),
  })
    .index("by_user_org", ["userId", "orgId"])
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"]),

  leads: defineTable({
    orgId: v.optional(v.id("organizations")),
    idempotencyKey: v.string(),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    serviceAddress: v.string(),
    segment: projectType,
    projectDetails: v.string(),
    desiredTimeframe: v.optional(v.string()),
    sourcePath: v.string(),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    contactConsentAt: v.number(),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("scheduled"),
      v.literal("closed"),
      v.literal("lost"),
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_org_and_idempotency_key", ["orgId", "idempotencyKey"])
    .index("by_org_and_email_and_created_at", ["orgId", "email", "createdAt"])
    .index("by_org_and_phone_and_created_at", ["orgId", "phone", "createdAt"])
    .index("by_status", ["status"])
    .index("by_idempotency_key", ["idempotencyKey"])
    .index("by_email_and_created_at", ["email", "createdAt"])
    .index("by_phone_and_created_at", ["phone", "createdAt"])
    .index("by_created_at", ["createdAt"]),

  estimates: defineTable({
    leadId: v.id("leads"),
    orgId: v.id("organizations"),
    scope: v.string(),
    pricing: v.union(v.number(), v.record(v.string(), v.any())),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired"),
    ),
    createdAt: v.number(),
  })
    .index("by_lead", ["leadId"])
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"]),

  jobs: defineTable({
    estimateId: v.id("estimates"),
    orgId: v.id("organizations"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    schedule: v.union(v.number(), v.record(v.string(), v.any()), v.string()),
    crewIds: v.array(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_status", ["status"]),

  checklists: defineTable({
    jobId: v.id("jobs"),
    orgId: v.id("organizations"),
    title: v.string(),
    status: checklistStatus,
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_job_and_created_at", ["jobId", "createdAt"])
    .index("by_org_and_created_at", ["orgId", "createdAt"]),

  checklistItems: defineTable({
    checklistId: v.id("checklists"),
    itemKey: v.string(),
    text: v.string(),
    position: v.number(),
    completed: v.boolean(),
    completedBy: v.optional(v.id("users")),
    completedAt: v.optional(v.number()),
  })
    .index("by_checklist_and_position", ["checklistId", "position"])
    .index("by_checklist_and_item_key", ["checklistId", "itemKey"]),

  documents: defineTable({
    blobUrl: v.string(),
    blobPathname: v.string(),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    orgId: v.id("organizations"),
    uploadedBy: v.id("users"),
    accessLevel: documentAccessLevel,
    jobId: v.optional(v.id("jobs")),
    createdAt: v.number(),
  })
    .index("by_blob_url", ["blobUrl"])
    .index("by_org_and_access_level", ["orgId", "accessLevel"])
    .index("by_org_and_access_level_and_job", [
      "orgId",
      "accessLevel",
      "jobId",
    ])
    .index("by_org_and_access_level_and_uploader", [
      "orgId",
      "accessLevel",
      "uploadedBy",
    ])
    .index("by_org_and_access_level_and_uploader_and_job", [
      "orgId",
      "accessLevel",
      "uploadedBy",
      "jobId",
    ]),

  auditEvents: defineTable({
    orgId: v.optional(v.id("organizations")),
    actorId: v.string(),
    action: v.string(),
    targetResource: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    timestamp: v.number(),
  })
    .index("by_org_and_target", ["orgId", "targetResource"])
    .index("by_org_and_actor_and_timestamp", ["orgId", "actorId", "timestamp"])
    .index("by_org_and_timestamp", ["orgId", "timestamp"])
    .index("by_target", ["targetResource"])
    .index("by_actor", ["actorId"]),
});
