import { v } from "convex/values";

export const leadValidator = v.object({
  _id: v.id("leads"),
  _creationTime: v.number(),
  orgId: v.optional(v.id("organizations")),
  idempotencyKey: v.string(),
  fullName: v.string(),
  email: v.string(),
  phone: v.string(),
  serviceAddress: v.string(),
  segment: v.union(
    v.literal("residential"),
    v.literal("commercial"),
    v.literal("public-sector"),
  ),
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
});

export const estimateValidator = v.object({
  _id: v.id("estimates"),
  _creationTime: v.number(),
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
});

export const jobValidator = v.object({
  _id: v.id("jobs"),
  _creationTime: v.number(),
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
});

export const auditEventValidator = v.object({
  _id: v.id("auditEvents"),
  _creationTime: v.number(),
  orgId: v.optional(v.id("organizations")),
  actorId: v.string(),
  action: v.string(),
  targetResource: v.string(),
  metadata: v.optional(v.record(v.string(), v.any())),
  timestamp: v.number(),
});
