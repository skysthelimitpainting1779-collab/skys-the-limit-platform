import { v } from "convex/values";

export const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  externalId: v.string(),
  tokenIdentifier: v.optional(v.string()),
  identitySource: v.optional(v.literal("workos_webhook")),
  identityStatus: v.optional(
    v.union(v.literal("active"), v.literal("disabled")),
  ),
  email: v.string(),
  role: v.union(
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
  ),
  name: v.string(),
  phone: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
});

export const membershipValidator = v.object({
  _id: v.id("memberships"),
  _creationTime: v.number(),
  userId: v.id("users"),
  orgId: v.id("organizations"),
  role: userValidator.fields.role,
  status: v.union(
    v.literal("active"),
    v.literal("invited"),
    v.literal("disabled"),
  ),
});

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
  assignedUserId: v.optional(v.id("users")),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const customerValidator = v.object({
  _id: v.id("customers"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  userId: v.optional(v.id("users")),
  fullName: v.string(),
  email: v.string(),
  phone: v.string(),
  notes: v.optional(v.string()),
  createdAt: v.number(),
});

export const estimateValidator = v.object({
  _id: v.id("estimates"),
  _creationTime: v.number(),
  leadId: v.id("leads"),
  customerId: v.optional(v.id("customers")),
  propertyId: v.optional(v.id("properties")),
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
  customerId: v.optional(v.id("customers")),
  propertyId: v.optional(v.id("properties")),
  orgId: v.id("organizations"),
  status: v.union(
    v.literal("scheduled"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled"),
  ),
  stage: v.optional(
    v.union(
      v.literal("scheduled"),
      v.literal("prep"),
      v.literal("in_progress"),
      v.literal("final_inspection"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  ),
  schedule: v.union(v.number(), v.record(v.string(), v.any()), v.string()),
  crewIds: v.array(v.id("users")),
  leadCrewUserId: v.optional(v.id("users")),
  createdAt: v.number(),
});

export const documentValidator = v.object({
  _id: v.id("documents"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  customerId: v.optional(v.id("customers")),
  jobId: v.optional(v.id("jobs")),
  title: v.string(),
  category: v.string(),
  fileUrl: v.string(),
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

export const cmsPageValidator = v.object({
  _id: v.id("cmsPages"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  slug: v.string(),
  routeType: v.string(),
  title: v.string(),
  summary: v.string(),
  layoutVariant: v.string(),
  seoTitle: v.string(),
  seoDescription: v.string(),
  canonicalPath: v.string(),
  indexable: v.boolean(),
  status: v.union(
    v.literal("draft"),
    v.literal("in_review"),
    v.literal("approved"),
    v.literal("published"),
    v.literal("archived"),
  ),
  currentRevisionId: v.optional(v.string()),
  publishedRevisionId: v.optional(v.string()),
  updatedBy: v.id("users"),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
});

export const cmsSectionValidator = v.object({
  _id: v.id("cmsPageSections"),
  _creationTime: v.number(),
  pageId: v.id("cmsPages"),
  sectionType: v.union(
    v.literal("signatureHero"),
    v.literal("transformationProof"),
    v.literal("preparationLayers"),
    v.literal("servicePathways"),
    v.literal("projectStory"),
    v.literal("ownerAccountability"),
    v.literal("writtenScopeProcess"),
    v.literal("faq"),
    v.literal("conversionCta"),
    v.literal("capabilitySummary"),
    v.literal("portalAnnouncement"),
  ),
  headline: v.string(),
  subheadline: v.optional(v.string()),
  content: v.record(v.string(), v.any()),
  order: v.number(),
  status: cmsPageValidator.fields.status,
});

export const serviceValidator = v.object({
  _id: v.id("services"),
  _creationTime: v.number(),
  slug: v.string(),
  audience: leadValidator.fields.segment,
  title: v.string(),
  shortDescription: v.string(),
  scopeCategories: v.array(v.string()),
  verifiedCapabilities: v.array(v.string()),
  ctaText: v.string(),
  status: cmsPageValidator.fields.status,
  publishedAt: v.optional(v.number()),
});

export const projectValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  slug: v.string(),
  serviceType: leadValidator.fields.segment,
  publicTitle: v.string(),
  publicSummary: v.string(),
  problem: v.string(),
  preparation: v.string(),
  execution: v.string(),
  result: v.string(),
  generalLocation: v.string(),
  assetIds: v.array(v.id("proofAssets")),
  permissionStatus: v.union(
    v.literal("public_approved"),
    v.literal("candidate_restricted"),
    v.literal("prohibited"),
  ),
  publicationStatus: cmsPageValidator.fields.status,
  publishedAt: v.optional(v.number()),
});
