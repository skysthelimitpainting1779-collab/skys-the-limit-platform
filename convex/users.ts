import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const userRoleValidator = v.union(
  v.literal("owner"),
  v.literal("staff"),
  v.literal("customer"),
  v.literal("crew")
);

export const get = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getByClerkId = query({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
  },
});

export const store = mutation({
  args: {
    externalId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.optional(userRoleValidator),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existing !== null) {
      const updates: {
        email: string;
        name: string;
        phone?: string;
        avatarUrl?: string;
        role?: "owner" | "staff" | "customer" | "crew";
      } = {
        email: args.email,
        name: args.name,
      };
      if (args.phone !== undefined) updates.phone = args.phone;
      if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
      if (args.role !== undefined) updates.role = args.role;

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      externalId: args.externalId,
      email: args.email,
      name: args.name,
      role: args.role ?? "customer",
      phone: args.phone,
      avatarUrl: args.avatarUrl,
    });
    return userId;
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: userRoleValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.userId);
    if (!existing) {
      throw new Error("User not found");
    }
    await ctx.db.patch(args.userId, { role: args.role });
    return await ctx.db.get(args.userId);
  },
});

export const list = query({
  args: {
    role: v.optional(userRoleValidator),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    if (args.role !== undefined) {
      return allUsers.filter((u) => u.role === args.role);
    }
    return allUsers;
  },
});
