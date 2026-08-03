import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  OPERATIONS_ROLES,
  requireActiveMembership,
  requireActiveOrganization,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { normalizeLeadMutationInput } from "./lib/leadValidation";
import { leadValidator } from "./lib/returnValidators";

export const leadStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("scheduled"),
  v.literal("closed"),
  v.literal("lost"),
);

export const projectTypeValidator = v.union(
  v.literal("residential"),
  v.literal("commercial"),
  v.literal("public-sector"),
);

/** Intentionally anonymous lead intake, bound to one active organization. */
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    idempotencyKey: v.string(),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    segment: projectTypeValidator,
    serviceAddress: v.string(),
    projectDetails: v.string(),
    desiredTimeframe: v.optional(v.string()),
    sourcePath: v.string(),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  },
  returns: v.object({ id: v.id("leads"), created: v.boolean() }),
  handler: async (ctx, args) => {
    await requireActiveOrganization(ctx, args.orgId);
    const input = normalizeLeadMutationInput(args);

    const existing = await ctx.db
      .query("leads")
      .withIndex("by_org_and_idempotency_key", (index) =>
        index
          .eq("orgId", args.orgId)
          .eq("idempotencyKey", input.idempotencyKey),
      )
      .unique();
    if (existing) return { id: existing._id, created: false };

    const now = Date.now();
    const windowStart = now - 15 * 60 * 1_000;
    const recentFromEmail = await ctx.db
      .query("leads")
      .withIndex("by_org_and_email_and_created_at", (index) =>
        index
          .eq("orgId", args.orgId)
          .eq("email", input.email)
          .gte("createdAt", windowStart),
      )
      .take(3);
    const recentFromPhone = await ctx.db
      .query("leads")
      .withIndex("by_org_and_phone_and_created_at", (index) =>
        index
          .eq("orgId", args.orgId)
          .eq("phone", input.phone)
          .gte("createdAt", windowStart),
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
      contactConsentAt: now,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
    return { id, created: true };
  },
});

export const get = query({
  args: { leadId: v.id("leads") },
  returns: leadValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const lead = await ctx.db.get(args.leadId);
    if (!lead?.orgId) throw new Error("LEAD_NOT_FOUND");
    await requireActiveMembership(ctx, actor._id, lead.orgId, OPERATIONS_ROLES);
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
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(ctx, actor._id, args.orgId, OPERATIONS_ROLES);
    return args.status === undefined
      ? await ctx.db
          .query("leads")
          .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
          .order("desc")
          .take(100)
      : await ctx.db
          .query("leads")
          .withIndex("by_org_and_status", (index) =>
            index.eq("orgId", args.orgId).eq("status", args.status!),
          )
          .order("desc")
          .take(100);
  },
});

export const updateStatus = mutation({
  args: { leadId: v.id("leads"), status: leadStatusValidator },
  returns: leadValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const lead = await ctx.db.get(args.leadId);
    if (!lead?.orgId) throw new Error("LEAD_NOT_FOUND");
    await requireActiveMembership(ctx, actor._id, lead.orgId, OPERATIONS_ROLES);
    await ctx.db.patch(lead._id, { status: args.status, updatedAt: Date.now() });
    const updated = await ctx.db.get(lead._id);
    if (!updated) throw new Error("LEAD_NOT_FOUND");
    return updated;
  },
});

export const search = query({
  args: { orgId: v.id("organizations"), query: v.string() },
  returns: v.array(leadValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(ctx, actor._id, args.orgId, OPERATIONS_ROLES);
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
      .order("desc")
      .take(200);
    const term = args.query.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter(
      (lead) =>
        lead.fullName.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.phone.toLowerCase().includes(term) ||
        lead.serviceAddress.toLowerCase().includes(term) ||
        lead.projectDetails.toLowerCase().includes(term),
    );
  },
});
