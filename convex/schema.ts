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
  // WorkOS role slugs are quarantined until an owner maps them explicitly.
  v.literal("member"),
);

const organizationStatus = v.union(
  v.literal("active"),
  v.literal("inactive"),
  v.literal("suspended"),
);

const membershipStatus = v.union(
  v.literal("active"),
  v.literal("invited"),
  v.literal("disabled"),
);

const documentAccessLevel = v.union(
  v.literal("public"),
  v.literal("customer"),
  v.literal("internal"),
  v.literal("restricted"),
);

const checklistStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
);

const leadStatus = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("scheduled"),
  v.literal("closed"),
  v.literal("lost"),
);

const estimateStatus = v.union(
  v.literal("draft"),
  v.literal("sent"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("expired"),
);

const jobStatus = v.union(
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);

const customerStatus = v.union(
  v.literal("prospect"),
  v.literal("active"),
  v.literal("archived"),
);

const claimStatus = v.union(
  v.literal("candidate"),
  v.literal("verified"),
  v.literal("rejected"),
);

const pageStatus = v.union(
  v.literal("draft"),
  v.literal("in_review"),
  v.literal("published"),
  v.literal("archived"),
);

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    tokenIdentifier: v.optional(v.string()),
    identitySource: v.optional(v.literal("workos_webhook")),
    identityStatus: v.optional(
      v.union(v.literal("active"), v.literal("disabled")),
    ),
    workosUpdatedAt: v.optional(v.string()),
    workosDeletedAt: v.optional(v.string()),
    email: v.string(),
    // Compatibility/display only. Authorization always comes from memberships.
    role: userRole,
    name: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  organizations: defineTable({
    workosOrganizationId: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),
    status: organizationStatus,
    settings: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_slug", ["slug"])
    .index("by_workosOrganizationId", ["workosOrganizationId"]),

  memberships: defineTable({
    workosMembershipId: v.optional(v.string()),
    workosRoleSlug: v.optional(v.string()),
    workosUpdatedAt: v.optional(v.string()),
    workosDeletedAt: v.optional(v.string()),
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: membershipRole,
    status: membershipStatus,
  })
    .index("by_user_org", ["userId", "orgId"])
    .index("by_org", ["orgId"])
    .index("by_org_and_role", ["orgId", "role"])
    .index("by_org_and_role_and_status", ["orgId", "role", "status"])
    .index("by_user", ["userId"])
    .index("by_workosMembershipId", ["workosMembershipId"]),

  leads: defineTable({
    // Migration-safe: new writes require orgId; legacy unscoped rows fail closed.
    orgId: v.optional(v.id("organizations")),
    customerId: v.optional(v.id("customers")),
    propertyId: v.optional(v.id("properties")),
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
    status: leadStatus,
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_org_and_created_at", ["orgId", "createdAt"])
    .index("by_org_and_idempotency_key", ["orgId", "idempotencyKey"])
    .index("by_org_and_email_and_created_at", ["orgId", "email", "createdAt"])
    .index("by_org_and_phone_and_created_at", ["orgId", "phone", "createdAt"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_idempotency_key", ["idempotencyKey"])
    .index("by_email_and_created_at", ["email", "createdAt"])
    .index("by_phone_and_created_at", ["phone", "createdAt"])
    .index("by_created_at", ["createdAt"]),

  customers: defineTable({
    orgId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    leadId: v.optional(v.id("leads")),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    status: customerStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_org_and_user", ["orgId", "userId"])
    .index("by_org_and_email", ["orgId", "email"])
    .index("by_user", ["userId"])
    .index("by_lead", ["leadId"]),

  properties: defineTable({
    orgId: v.id("organizations"),
    customerId: v.id("customers"),
    label: v.optional(v.string()),
    address: v.string(),
    propertyType: v.optional(v.string()),
    accessNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_org_and_customer", ["orgId", "customerId"]),

  estimates: defineTable({
    leadId: v.id("leads"),
    orgId: v.id("organizations"),
    customerId: v.optional(v.id("customers")),
    propertyId: v.optional(v.id("properties")),
    scope: v.string(),
    pricing: v.union(v.number(), v.record(v.string(), v.any())),
    status: estimateStatus,
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_lead", ["leadId"])
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_org_and_customer", ["orgId", "customerId"])
    .index("by_customer", ["customerId"]),

  jobs: defineTable({
    estimateId: v.optional(v.id("estimates")),
    orgId: v.id("organizations"),
    customerId: v.optional(v.id("customers")),
    propertyId: v.optional(v.id("properties")),
    title: v.optional(v.string()),
    address: v.optional(v.string()),
    status: jobStatus,
    schedule: v.union(v.number(), v.record(v.string(), v.any()), v.string()),
    crewIds: v.array(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_estimate", ["estimateId"])
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_org_and_customer", ["orgId", "customerId"])
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"]),

  assignments: defineTable({
    orgId: v.id("organizations"),
    jobId: v.id("jobs"),
    userId: v.id("users"),
    jobStatus,
    jobCreatedAt: v.number(),
    assignedAt: v.number(),
  })
    .index("by_job", ["jobId"])
    .index("by_job_and_user", ["jobId", "userId"])
    .index("by_org_and_user_and_job_created_at", [
      "orgId",
      "userId",
      "jobCreatedAt",
    ])
    .index("by_org_and_user_and_job_status_and_job_created_at", [
      "orgId",
      "userId",
      "jobStatus",
      "jobCreatedAt",
    ]),

  tasks: defineTable({
    orgId: v.id("organizations"),
    jobId: v.id("jobs"),
    title: v.string(),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
    completed: v.boolean(),
    completedBy: v.optional(v.id("users")),
    completedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_job_and_created_at", ["jobId", "createdAt"])
    .index("by_org_and_assignee", ["orgId", "assigneeId"]),

  projectUpdates: defineTable({
    orgId: v.id("organizations"),
    jobId: v.id("jobs"),
    customerId: v.optional(v.id("customers")),
    actorId: v.id("users"),
    message: v.string(),
    customerVisible: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_job_and_created_at", ["jobId", "createdAt"])
    .index("by_org_and_customer_and_customer_visible_and_created_at", [
      "orgId",
      "customerId",
      "customerVisible",
      "createdAt",
    ])
    .index("by_customer_and_customer_visible_and_created_at", [
      "customerId",
      "customerVisible",
      "createdAt",
    ]),

  notifications: defineTable({
    orgId: v.id("organizations"),
    recipientUserId: v.id("users"),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    link: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_org_and_recipient_and_created_at", [
      "orgId",
      "recipientUserId",
      "createdAt",
    ])
    .index("by_org_and_recipient_and_is_read_and_created_at", [
      "orgId",
      "recipientUserId",
      "isRead",
      "createdAt",
    ])
    .index("by_recipient_and_created_at", ["recipientUserId", "createdAt"])
    .index("by_recipient_and_is_read_and_created_at", [
      "recipientUserId",
      "isRead",
      "createdAt",
    ]),

  notificationCounters: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    unreadCount: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org_and_user", ["orgId", "userId"])
    .index("by_user", ["userId"]),

  claims: defineTable({
    orgId: v.id("organizations"),
    claimKey: v.string(),
    text: v.string(),
    status: claimStatus,
    notes: v.optional(v.string()),
    proofAssetId: v.optional(v.id("proofAssets")),
    createdBy: v.id("users"),
    reviewedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_org_and_claim_key", ["orgId", "claimKey"]),

  proofAssets: defineTable({
    orgId: v.id("organizations"),
    documentId: v.id("documents"),
    label: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_org", ["orgId"]),

  cmsPages: defineTable({
    orgId: v.id("organizations"),
    slug: v.string(),
    title: v.string(),
    content: v.string(),
    status: pageStatus,
    claimIds: v.array(v.id("claims")),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_status", ["orgId", "status"])
    .index("by_org_and_slug", ["orgId", "slug"])
    .index("by_org_and_slug_and_status", ["orgId", "slug", "status"]),

  cmsRevisions: defineTable({
    orgId: v.id("organizations"),
    pageId: v.id("cmsPages"),
    title: v.string(),
    content: v.string(),
    status: pageStatus,
    claimIds: v.array(v.id("claims")),
    actorId: v.id("users"),
    createdAt: v.number(),
  }).index("by_page_and_created_at", ["pageId", "createdAt"]),

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
    .index("by_org_and_access_level_and_job", ["orgId", "accessLevel", "jobId"])
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
    // Migration-safe for legacy system events; all new appends require orgId.
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
