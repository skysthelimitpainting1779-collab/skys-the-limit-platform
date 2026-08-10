import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { env, internalMutation } from "./_generated/server";

function requireWorkOSOrganizationId() {
  const workosOrganizationId = env.WORKOS_ORGANIZATION_ID?.trim();
  if (!workosOrganizationId) {
    throw new Error("WORKOS_ORGANIZATION_ID_NOT_CONFIGURED");
  }
  return workosOrganizationId;
}

async function ensureOrganization(
  ctx: MutationCtx,
  options: { name: string; slug: string },
) {
  const workosOrganizationId = requireWorkOSOrganizationId();
  const byWorkOSId = await ctx.db
    .query("organizations")
    .withIndex("by_workosOrganizationId", (query) =>
      query.eq("workosOrganizationId", workosOrganizationId),
    )
    .unique();
  if (byWorkOSId) {
    if (byWorkOSId.status !== "active") {
      throw new Error("ORGANIZATION_INACTIVE");
    }
    return byWorkOSId._id;
  }

  const bySlug = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (query) => query.eq("slug", options.slug))
    .unique();
  if (bySlug) {
    if (
      bySlug.status !== "active" ||
      (bySlug.workosOrganizationId &&
        bySlug.workosOrganizationId !== workosOrganizationId)
    ) {
      throw new Error("ORGANIZATION_BOOTSTRAP_CONFLICT");
    }
    await ctx.db.patch(bySlug._id, { workosOrganizationId });
    return bySlug._id;
  }

  return await ctx.db.insert("organizations", {
    ...options,
    workosOrganizationId,
    status: "active",
  });
}

/**
 * Creates the isolated tenant used by the anonymous local CI backend.
 * Internal registration prevents browsers from reaching this bootstrap seam.
 */
export const ensureLocalTestOrganization = internalMutation({
  args: { environment: v.literal("local-ci") },
  returns: v.id("organizations"),
  handler: async (ctx) => {
    return await ensureOrganization(ctx, {
      name: "Local CI Organization",
      slug: "local-ci",
    });
  },
});

/** Seeds the isolated tenant after Vercel creates a branch Preview backend. */
export const ensurePreviewOrganization = internalMutation({
  args: {},
  returns: v.id("organizations"),
  handler: async (ctx) => {
    return await ensureOrganization(ctx, {
      name: "Sky's the Limit Preview",
      slug: "vercel-preview",
    });
  },
});
