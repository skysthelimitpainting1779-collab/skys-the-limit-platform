import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("staff"), v.literal("customer"), v.literal("crew")),
    externalId: v.string(),
  }).index("by_externalId", ["externalId"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  memberships: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: v.string(),
  }).index("by_user_org", ["userId", "orgId"]),

  leads: defineTable({
    customerName: v.string(),
    email: v.string(),
    phone: v.string(),
    serviceType: v.union(v.literal("residential"), v.literal("commercial"), v.literal("public-sector")),
    status: v.union(v.literal("new"), v.literal("qualified"), v.literal("scheduled"), v.literal("closed")),
    details: v.string(),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  estimates: defineTable({
    leadId: v.id("leads"),
    amount: v.number(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
  }),

  jobs: defineTable({
    estimateId: v.id("estimates"),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed")),
    scheduledDate: v.number(),
  }),

  auditEvents: defineTable({
    actorId: v.string(),
    action: v.string(),
    resource: v.string(),
    timestamp: v.number(),
  }),
});
