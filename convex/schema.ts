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

const cmsStatus = v.union(
  v.literal("draft"),
  v.literal("in_review"),
  v.literal("approved"),
  v.literal("published"),
  v.literal("archived"),
);

const permissionStatus = v.union(
  v.literal("public_approved"),
  v.literal("candidate_restricted"),
  v.literal("prohibited"),
);

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    email: v.string(),
    role: userRole,
    name: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_email", ["email"])
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
    role: userRole,
    status: v.union(
      v.literal("active"),
      v.literal("invited"),
      v.literal("disabled"),
    ),
  })
    .index("by_user_org", ["userId", "orgId"])
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"]),

  // --- CMS TABLES ---
  siteSettings: defineTable({
    orgId: v.id("organizations"),
    siteName: v.string(),
    verifiedPhone: v.string(),
    verifiedEmail: v.string(),
    address: v.string(),
    serviceAreaSummary: v.string(),
    defaultSeoTitle: v.string(),
    defaultSeoDescription: v.string(),
    socialLinks: v.record(v.string(), v.string()),
    publishingStatus: cmsStatus,
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_org", ["orgId"]),

  navigationItems: defineTable({
    orgId: v.id("organizations"),
    label: v.string(),
    href: v.string(),
    location: v.union(
      v.literal("header"),
      v.literal("footer"),
      v.literal("portal"),
    ),
    parentId: v.optional(v.id("navigationItems")),
    order: v.number(),
    audience: v.union(
      v.literal("public"),
      v.literal("customer"),
      v.literal("crew"),
      v.literal("operations"),
    ),
    enabled: v.boolean(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_org_location", ["orgId", "location"])
    .index("by_order", ["order"]),

  cmsPages: defineTable({
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
    status: cmsStatus,
    currentRevisionId: v.optional(v.string()),
    publishedRevisionId: v.optional(v.string()),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_slug_status", ["slug", "status"])
    .index("by_org_status", ["orgId", "status"]),

  cmsPageSections: defineTable({
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
    status: cmsStatus,
  })
    .index("by_page_order", ["pageId", "order"])
    .index("by_page_status", ["pageId", "status"]),

  cmsRevisions: defineTable({
    entityType: v.string(),
    entityId: v.string(),
    revisionNumber: v.number(),
    snapshot: v.record(v.string(), v.any()),
    changeSummary: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_entity_revision", ["entityType", "entityId", "revisionNumber"]),

  services: defineTable({
    slug: v.string(),
    audience: projectType,
    title: v.string(),
    shortDescription: v.string(),
    scopeCategories: v.array(v.string()),
    verifiedCapabilities: v.array(v.string()),
    ctaText: v.string(),
    status: cmsStatus,
    publishedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  proofAssets: defineTable({
    assetKey: v.string(),
    originalSource: v.string(),
    sourceHash: v.string(),
    derivativePath: v.string(),
    classification: v.string(),
    permissionStatus: permissionStatus,
    allowedUses: v.array(v.string()),
    prohibitedUses: v.array(v.string()),
    altText: v.string(),
    focalPoint: v.string(),
    width: v.number(),
    height: v.number(),
    publicationStatus: cmsStatus,
    verifiedBy: v.id("users"),
    verifiedAt: v.number(),
  })
    .index("by_key", ["assetKey"])
    .index("by_permission", ["permissionStatus"])
    .index("by_publication", ["publicationStatus"]),

  projects: defineTable({
    slug: v.string(),
    serviceType: projectType,
    publicTitle: v.string(),
    publicSummary: v.string(),
    problem: v.string(),
    preparation: v.string(),
    execution: v.string(),
    result: v.string(),
    generalLocation: v.string(),
    assetIds: v.array(v.id("proofAssets")),
    permissionStatus: permissionStatus,
    publicationStatus: cmsStatus,
    publishedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_publication", ["publicationStatus"]),

  faqs: defineTable({
    audience: v.union(v.literal("all"), projectType),
    serviceId: v.optional(v.id("services")),
    question: v.string(),
    answer: v.string(),
    status: cmsStatus,
    order: v.number(),
  })
    .index("by_audience_order", ["audience", "order"])
    .index("by_status", ["status"]),

  announcements: defineTable({
    audience: v.union(
      v.literal("all_portals"),
      v.literal("customer"),
      v.literal("crew"),
      v.literal("operations"),
    ),
    title: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical"),
    ),
    activeFrom: v.number(),
    activeUntil: v.number(),
    status: cmsStatus,
  }).index("by_audience_active", ["audience", "status"]),

  // --- APPLICATION & REVENUE TABLES ---
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
    assignedUserId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_idempotency_key", ["idempotencyKey"])
    .index("by_email_and_created_at", ["email", "createdAt"])
    .index("by_phone_and_created_at", ["phone", "createdAt"])
    .index("by_created_at", ["createdAt"]),

  customers: defineTable({
    orgId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["email"])
    .index("by_user", ["userId"]),

  properties: defineTable({
    customerId: v.id("customers"),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    propertyType: projectType,
    accessNotes: v.optional(v.string()),
  }).index("by_customer", ["customerId"]),

  estimates: defineTable({
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
  })
    .index("by_lead", ["leadId"])
    .index("by_customer", ["customerId"])
    .index("by_org", ["orgId"])
    .index("by_status", ["status"]),

  estimateVersions: defineTable({
    estimateId: v.id("estimates"),
    versionNumber: v.number(),
    scopeSummary: v.string(),
    documentUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_estimate_version", ["estimateId", "versionNumber"]),

  jobs: defineTable({
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
  })
    .index("by_org", ["orgId"])
    .index("by_status", ["status"])
    .index("by_customer", ["customerId"])
    .index("by_stage", ["stage"]),

  assignments: defineTable({
    jobId: v.id("jobs"),
    userId: v.id("users"),
    assignedDate: v.number(),
    role: v.string(),
  })
    .index("by_job", ["jobId"])
    .index("by_user_date", ["userId", "assignedDate"]),

  tasks: defineTable({
    jobId: v.id("jobs"),
    title: v.string(),
    description: v.optional(v.string()),
    assignedUserId: v.optional(v.id("users")),
    completed: v.boolean(),
    dueAt: v.optional(v.number()),
  })
    .index("by_job_completed", ["jobId", "completed"])
    .index("by_assigned_user", ["assignedUserId"]),

  checklists: defineTable({
    jobId: v.id("jobs"),
    category: v.union(
      v.literal("preparation"),
      v.literal("safety"),
      v.literal("quality"),
      v.literal("completion"),
    ),
    items: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        completed: v.boolean(),
        completedBy: v.optional(v.id("users")),
        completedAt: v.optional(v.number()),
      }),
    ),
  }).index("by_job_category", ["jobId", "category"]),

  projectUpdates: defineTable({
    jobId: v.id("jobs"),
    authorId: v.id("users"),
    updateType: v.union(
      v.literal("prep_complete"),
      v.literal("coat_applied"),
      v.literal("issue_flagged"),
      v.literal("milestone_passed"),
      v.literal("walkthrough_scheduled"),
    ),
    note: v.string(),
    storageId: v.optional(v.string()),
    visibility: v.union(
      v.literal("internal"),
      v.literal("customer_visible"),
      v.literal("public_proof"),
    ),
    createdAt: v.number(),
  }).index("by_job_createdAt", ["jobId", "createdAt"]),

  documents: defineTable({
    orgId: v.id("organizations"),
    customerId: v.optional(v.id("customers")),
    jobId: v.optional(v.id("jobs")),
    title: v.string(),
    category: v.string(),
    fileUrl: v.string(),
    createdAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_job", ["jobId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user_read", ["userId", "read"]),

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
