import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Creates the isolated tenant used by the anonymous local CI backend.
 * Internal registration prevents browsers from reaching this bootstrap seam.
 */
export const ensureLocalTestOrganization = internalMutation({
  args: { environment: v.literal("local-ci") },
  returns: v.id("organizations"),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (query) => query.eq("slug", "local-ci"))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("organizations", {
      name: "Local CI Organization",
      slug: "local-ci",
      status: "active",
    });
  },
});
