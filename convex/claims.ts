import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  CONTENT_APPROVER_ROLES,
  CONTENT_EDITOR_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { appendAuditEvent } from "./lib/audit";

export const claimStatusValidator = v.union(
  v.literal("candidate"),
  v.literal("verified"),
  v.literal("rejected"),
);

const claimValidator = v.object({
  _id: v.id("claims"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  claimKey: v.string(),
  text: v.string(),
  status: claimStatusValidator,
  notes: v.optional(v.string()),
  proofAssetId: v.optional(v.id("proofAssets")),
  createdBy: v.id("users"),
  reviewedBy: v.optional(v.id("users")),
  createdAt: v.number(),
  updatedAt: v.number(),
});

function normalized(value: string, code: string, max: number) {
  const result = value.trim();
  if (!result || result.length > max) throw new Error(code);
  return result;
}

function normalizedNotes(value: string | undefined) {
  if (value === undefined) return undefined;
  const result = value.trim();
  if (result.length > 2_000) throw new Error("INVALID_CLAIM_NOTES");
  return result || undefined;
}

export const list = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(claimStatusValidator),
  },
  returns: v.array(claimValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      CONTENT_EDITOR_ROLES,
    );
    return args.status === undefined
      ? await ctx.db
          .query("claims")
          .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
          .order("desc")
          .take(100)
      : await ctx.db
          .query("claims")
          .withIndex("by_org_and_status", (index) =>
            index.eq("orgId", args.orgId).eq("status", args.status!),
          )
          .order("desc")
          .take(100);
  },
});

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    claimKey: v.string(),
    text: v.string(),
    proofAssetId: v.optional(v.id("proofAssets")),
  },
  returns: v.id("claims"),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      CONTENT_EDITOR_ROLES,
    );
    const claimKey = normalized(args.claimKey, "INVALID_CLAIM_KEY", 120);
    const existing = await ctx.db
      .query("claims")
      .withIndex("by_org_and_claim_key", (index) =>
        index.eq("orgId", args.orgId).eq("claimKey", claimKey),
      )
      .unique();
    if (existing) throw new Error("CLAIM_KEY_ALREADY_EXISTS");
    if (args.proofAssetId) {
      const proofAsset = await ctx.db.get(args.proofAssetId);
      if (!proofAsset || proofAsset.orgId !== args.orgId) {
        throw new Error("PROOF_ASSET_NOT_FOUND");
      }
    }
    const now = Date.now();
    const claimId = await ctx.db.insert("claims", {
      orgId: args.orgId,
      claimKey,
      text: normalized(args.text, "INVALID_CLAIM_TEXT", 2_000),
      status: "candidate",
      proofAssetId: args.proofAssetId,
      createdBy: actor._id,
      createdAt: now,
      updatedAt: now,
    });
    await appendAuditEvent(ctx, {
      orgId: args.orgId,
      actorId: actor._id,
      action: "claim.created",
      targetResource: claimId,
      metadata: { claimKey },
      timestamp: now,
    });
    return claimId;
  },
});

export const updateStatus = mutation({
  args: {
    claimId: v.id("claims"),
    status: claimStatusValidator,
    notes: v.optional(v.string()),
  },
  returns: claimValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("CLAIM_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      actor._id,
      claim.orgId,
      CONTENT_APPROVER_ROLES,
    );
    const now = Date.now();
    await ctx.db.patch(claim._id, {
      status: args.status,
      notes: normalizedNotes(args.notes),
      reviewedBy: actor._id,
      updatedAt: now,
    });
    await appendAuditEvent(ctx, {
      orgId: claim.orgId,
      actorId: actor._id,
      action: "claim.status_updated",
      targetResource: claim._id,
      metadata: { from: claim.status, to: args.status },
      timestamp: now,
    });
    const updated = await ctx.db.get(claim._id);
    if (!updated) throw new Error("CLAIM_NOT_FOUND");
    return updated;
  },
});
