import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/** Operator-controlled WorkOS organization binding; never exposed to clients. */
export const bindWorkOSOrganization = internalMutation({
  args: {
    orgId: v.id("organizations"),
    workOSOrganizationId: v.string(),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.orgId);
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");

    const collision = await ctx.db
      .query("organizations")
      .withIndex("by_externalId", (query) =>
        query.eq("externalId", args.workOSOrganizationId),
      )
      .unique();
    if (collision && collision._id !== args.orgId) {
      throw new Error("WORKOS_ORGANIZATION_ALREADY_BOUND");
    }

    await ctx.db.patch(args.orgId, {
      externalId: args.workOSOrganizationId,
    });
    return args.orgId;
  },
});
