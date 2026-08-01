import { mutation } from "./_generated/server";
import { v } from "convex/values";

const segment = v.union(
  v.literal("residential"),
  v.literal("commercial"),
  v.literal("public-sector"),
);

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
    consentAt: v.number(),
    createdAt: v.number(),
  },
  returns: v.object({
    id: v.id("leads"),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_idempotency_key", (query) =>
        query.eq("idempotencyKey", args.idempotencyKey),
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
        query.eq("email", args.email).gte("createdAt", fifteenMinutesAgo),
      )
      .take(3);

    if (recentFromEmail.length >= 3) {
      throw new Error("RATE_LIMITED");
    }

    const id = await ctx.db.insert("leads", {
      idempotencyKey: args.idempotencyKey,
      customerName: args.fullName,
      email: args.email,
      phone: args.phone,
      address: args.serviceAddress,
      projectType: args.segment,
      projectDetails: args.projectDetails,
      desiredTimeframe: args.desiredTimeframe,
      sourcePath: args.sourcePath,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      contactConsentAt: serverNow,
      status: "new",
      createdAt: serverNow,
      updatedAt: serverNow,
    });

    return { id, created: true };
  },
});
