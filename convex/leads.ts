import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeLeadMutationInput } from "./lib/leadValidation";

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
    const input = normalizeLeadMutationInput(args);

    const existing = await ctx.db
      .query("leads")
      .withIndex("by_idempotency_key", (query) =>
        query.eq("idempotencyKey", input.idempotencyKey),
      )
      .unique();

    if (existing) {
      return { id: existing._id, created: false };
    }

    const serverNow = Date.now();
    const fifteenMinutesAgo = serverNow - 15 * 60 * 1000;
    const recentFromEmail = await ctx.db
      .query("leads")
      .withIndex("by_email_and_created_at", (query) =>
        query.eq("email", input.email).gte("createdAt", fifteenMinutesAgo),
      )
      .take(3);
    const recentFromPhone = await ctx.db
      .query("leads")
      .withIndex("by_phone_and_created_at", (query) =>
        query.eq("phone", input.phone).gte("createdAt", fifteenMinutesAgo),
      )
      .take(3);

    if (recentFromEmail.length >= 3 || recentFromPhone.length >= 3) {
      throw new Error("RATE_LIMITED");
    }

    const id = await ctx.db.insert("leads", {
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
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leadId);
  },
});

export const list = query({
  args: {
    status: v.optional(leadStatusValidator),
  },
  handler: async (ctx, args) => {
    if (args.status !== undefined) {
      return await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    return await ctx.db.query("leads").collect();
  },
});

export const updateStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: leadStatusValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.leadId);
    if (!existing) {
      throw new Error("Lead not found");
    }
    await ctx.db.patch(args.leadId, { status: args.status, updatedAt: Date.now() });
    return await ctx.db.get(args.leadId);
  },
});

export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const leads = await ctx.db.query("leads").collect();
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
