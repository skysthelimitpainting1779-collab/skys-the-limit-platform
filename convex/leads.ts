import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeLeadMutationInput } from "./lib/leadValidation";
import {
  OPERATIONS_ROLES,
  requireActiveMembership,
  requireActiveOrganization,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { leadValidator } from "./lib/returnValidators";

export const leadStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("scheduled"),
  v.literal("closed"),
  v.literal("lost")
);

export const projectTypeValidator = v.union(
  v.literal("residential"),
  v.literal("commercial"),
  v.literal("public-sector")
);

const segment = projectTypeValidator;

// Validated, idempotent lead intake — used by the public estimate form.
// All input is normalized and validated by normalizeLeadMutationInput before
// any DB read or write. Returns { id, created } so callers can distinguish
// new leads from duplicate submissions.
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    idempotencyKey: v.string(),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    segment,
    serviceAddress: v.string(),
    projectDetails: v.string(),
    desiredTimeframe: v.optional(v.string()),
    sourcePath: v.string(),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  },
  returns: v.object({
    id: v.id("leads"),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireActiveOrganization(ctx, args.orgId);
    const input = normalizeLeadMutationInput(args);

    const existing = await ctx.db
      .query("leads")
      .withIndex("by_org_and_idempotency_key", (query) =>
        query
          .eq("orgId", args.orgId)
          .eq("idempotencyKey", input.idempotencyKey),
      )
      .unique();

    if (existing) {
      return { id: existing._id, created: false };
    }

    const serverNow = Date.now();
    const fifteenMinutesAgo = serverNow - 15 * 60 * 1000;
    const recentFromEmail = await ctx.db
      .query("leads")
      .withIndex("by_org_and_email_and_created_at", (query) =>
        query
          .eq("orgId", args.orgId)
          .eq("email", input.email)
          .gte("createdAt", fifteenMinutesAgo),
      )
      .take(3);
    const recentFromPhone = await ctx.db
      .query("leads")
      .withIndex("by_org_and_phone_and_created_at", (query) =>
        query
          .eq("orgId", args.orgId)
          .eq("phone", input.phone)
          .gte("createdAt", fifteenMinutesAgo),
      )
      .take(3);

    if (recentFromEmail.length >= 3 || recentFromPhone.length >= 3) {
      throw new Error("RATE_LIMITED");
    }

    const id = await ctx.db.insert("leads", {
      orgId: args.orgId,
      idempotencyKey: input.idempotencyKey,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      serviceAddress: input.serviceAddress,
      segment: input.segment,
      projectDetails: input.projectDetails,
      desiredTimeframe: input.desiredTimeframe,
      sourcePath: input.sourcePath,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      contactConsentAt: serverNow,
      status: "new",
      createdAt: serverNow,
      updatedAt: serverNow,
    });

    return { id, created: true };
  },
});

export const get = query({
  args: {
    leadId: v.id("leads"),
  },
  returns: leadValidator,
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const lead = await ctx.db.get(args.leadId);
    if (!lead?.orgId) throw new Error("LEAD_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      currentUser._id,
      lead.orgId,
      OPERATIONS_ROLES,
    );
    return lead;
  },
});

export const list = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(leadStatusValidator),
  },
  returns: v.array(leadValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      currentUser._id,
      args.orgId,
      OPERATIONS_ROLES,
    );
    if (args.status !== undefined) {
      return await ctx.db
        .query("leads")
        .withIndex("by_org_and_status", (q) =>
          q.eq("orgId", args.orgId).eq("status", args.status!),
        )
        .take(100);
    }
    return await ctx.db
      .query("leads")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(100);
  },
});

export const updateStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: leadStatusValidator,
  },
  returns: leadValidator,
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const existing = await ctx.db.get(args.leadId);
    if (!existing?.orgId) {
      throw new Error("Lead not found");
    }
    await requireActiveMembership(
      ctx,
      currentUser._id,
      existing.orgId,
      OPERATIONS_ROLES,
    );
    await ctx.db.patch(args.leadId, { status: args.status, updatedAt: Date.now() });
    const updated = await ctx.db.get(args.leadId);
    if (!updated) throw new Error("Lead not found");
    return updated;
  },
});

export const search = query({
  args: {
    orgId: v.id("organizations"),
    query: v.string(),
  },
  returns: v.array(leadValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      currentUser._id,
      args.orgId,
      OPERATIONS_ROLES,
    );
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_org", (query) => query.eq("orgId", args.orgId))
      .order("desc")
      .take(200);
    const q = args.query.trim().toLowerCase();
    if (!q) {
      return leads;
    }
    return leads.filter(
      (lead) =>
        (lead.fullName ?? "").toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        (lead.serviceAddress && lead.serviceAddress.toLowerCase().includes(q)) ||
        (lead.projectDetails && lead.projectDetails.toLowerCase().includes(q))
    );
  },
});
