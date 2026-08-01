import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const projectType = v.union(
  v.literal("residential"),
  v.literal("commercial"),
  v.literal("public-sector"),
);

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("staff"),
      v.literal("customer"),
      v.literal("crew"),
    ),
    name: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }).index("by_externalId", ["externalId"]),

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
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
    ),
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
    .index("by_org", ["orgId"]),

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
    .index("by_status", ["status"]),

  auditEvents: defineTable({
    actorId: v.string(),
    action: v.string(),
    targetResource: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    timestamp: v.number(),
  })
    .index("by_target", ["targetResource"])
    .index("by_actor", ["actorId"]),
});
