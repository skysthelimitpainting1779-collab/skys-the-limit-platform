import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

export const create = mutation({
  args: {
    customerName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.optional(v.string()),
    projectType: projectTypeValidator,
    status: v.optional(leadStatusValidator),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert("leads", {
      customerName: args.customerName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      projectType: args.projectType,
      status: args.status ?? "new",
      notes: args.notes,
      createdAt: Date.now(),
    });
    return leadId;
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
    await ctx.db.patch(args.leadId, { status: args.status });
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
        lead.customerName.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        (lead.address && lead.address.toLowerCase().includes(q)) ||
        (lead.notes && lead.notes.toLowerCase().includes(q))
    );
  },
});
