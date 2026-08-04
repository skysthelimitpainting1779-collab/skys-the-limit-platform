import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  CONTENT_APPROVER_ROLES,
  CONTENT_EDITOR_ROLES,
  requireActiveMembership,
  requireActiveOrganization,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { appendAuditEvent } from "./lib/audit";

export const pageStatusValidator = v.union(
  v.literal("draft"),
  v.literal("in_review"),
  v.literal("published"),
  v.literal("archived"),
);

const pageResultValidator = v.object({
  _id: v.id("cmsPages"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  slug: v.string(),
  title: v.string(),
  content: v.string(),
  status: pageStatusValidator,
  claimIds: v.array(v.id("claims")),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
});

function pageResult(page: Doc<"cmsPages">) {
  return {
    _id: page._id,
    _creationTime: page._creationTime,
    orgId: page.orgId,
    slug: page.slug,
    title: page.title,
    content: page.content,
    status: page.status,
    claimIds: page.claimIds,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt,
  };
}

function normalized(value: string, code: string, max: number) {
  const result = value.trim();
  if (!result || result.length > max) throw new Error(code);
  return result;
}

function normalizedSlug(value: string) {
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    throw new Error("INVALID_PAGE_SLUG");
  }
  return slug;
}

async function validateClaims(
  ctx: Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">,
  orgId: Id<"organizations">,
  claimIds: Id<"claims">[],
  requireVerified: boolean,
) {
  const unique = [...new Set(claimIds)];
  if (unique.length !== claimIds.length || unique.length > 50) {
    throw new Error("INVALID_PAGE_CLAIMS");
  }
  for (const claimId of unique) {
    const claim = await ctx.db.get(claimId);
    if (!claim || claim.orgId !== orgId) throw new Error("INVALID_PAGE_CLAIMS");
    if (requireVerified && claim.status !== "verified") {
      throw new Error("CLAIMS_VERIFICATION_FAILED");
    }
  }
  return unique;
}

async function allClaimsVerified(
  ctx: Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">,
  page: Doc<"cmsPages">,
) {
  if (page.claimIds.length > 50) return false;
  for (const claimId of page.claimIds) {
    const claim = await ctx.db.get(claimId);
    if (!claim || claim.orgId !== page.orgId || claim.status !== "verified") {
      return false;
    }
  }
  return true;
}

async function insertRevision(
  ctx: MutationCtx,
  page: Doc<"cmsPages">,
  actorId: Id<"users">,
  createdAt: number,
) {
  await ctx.db.insert("cmsRevisions", {
    orgId: page.orgId,
    pageId: page._id,
    title: page.title,
    content: page.content,
    status: page.status,
    claimIds: page.claimIds,
    actorId,
    createdAt,
  });
}

export const listPages = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(pageStatusValidator),
  },
  returns: v.array(pageResultValidator),
  handler: async (ctx, args) => {
    await requireActiveOrganization(ctx, args.orgId);
    const identity = await ctx.auth.getUserIdentity();
    const isPublicRequest = !identity || args.status === "published";
    let selectedStatus = args.status;
    if (isPublicRequest) {
      if (selectedStatus !== undefined && selectedStatus !== "published") {
        throw new Error("UNAUTHENTICATED");
      }
      selectedStatus = "published";
    } else {
      const actor = await requireAuthenticatedUser(ctx);
      await requireActiveMembership(
        ctx,
        actor._id,
        args.orgId,
        CONTENT_EDITOR_ROLES,
      );
    }
    const pages =
      selectedStatus === undefined
        ? await ctx.db
            .query("cmsPages")
            .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
            .order("desc")
            .take(100)
        : await ctx.db
            .query("cmsPages")
            .withIndex("by_org_and_status", (index) =>
              index.eq("orgId", args.orgId).eq("status", selectedStatus!),
            )
            .order("desc")
            .take(100);
    if (!isPublicRequest) return pages.map(pageResult);
    const verifiedPages = [];
    for (const page of pages) {
      if (await allClaimsVerified(ctx, page)) verifiedPages.push(pageResult(page));
    }
    return verifiedPages;
  },
});

export const getPublishedBySlug = query({
  args: { orgId: v.id("organizations"), slug: v.string() },
  returns: v.union(v.null(), pageResultValidator),
  handler: async (ctx, args) => {
    await requireActiveOrganization(ctx, args.orgId);
    const page = await ctx.db
      .query("cmsPages")
      .withIndex("by_org_and_slug_and_status", (index) =>
        index
          .eq("orgId", args.orgId)
          .eq("slug", normalizedSlug(args.slug))
          .eq("status", "published"),
      )
      .unique();
    return page && (await allClaimsVerified(ctx, page)) ? pageResult(page) : null;
  },
});

export const createDraft = mutation({
  args: {
    orgId: v.id("organizations"),
    slug: v.string(),
    title: v.string(),
    content: v.string(),
    claimIds: v.optional(v.array(v.id("claims"))),
  },
  returns: v.id("cmsPages"),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      CONTENT_EDITOR_ROLES,
    );
    const slug = normalizedSlug(args.slug);
    const existing = await ctx.db
      .query("cmsPages")
      .withIndex("by_org_and_slug", (index) =>
        index.eq("orgId", args.orgId).eq("slug", slug),
      )
      .unique();
    if (existing) throw new Error("PAGE_SLUG_ALREADY_EXISTS");
    const claimIds = await validateClaims(
      ctx,
      args.orgId,
      args.claimIds ?? [],
      false,
    );
    const now = Date.now();
    const pageId = await ctx.db.insert("cmsPages", {
      orgId: args.orgId,
      slug,
      title: normalized(args.title, "INVALID_PAGE_TITLE", 200),
      content: normalized(args.content, "INVALID_PAGE_CONTENT", 100_000),
      status: "draft",
      claimIds,
      createdBy: actor._id,
      updatedBy: actor._id,
      createdAt: now,
      updatedAt: now,
    });
    const page = await ctx.db.get(pageId);
    if (!page) throw new Error("PAGE_NOT_FOUND");
    await insertRevision(ctx, page, actor._id, now);
    await appendAuditEvent(ctx, {
      orgId: args.orgId,
      actorId: actor._id,
      action: "cms.page_created",
      targetResource: pageId,
      metadata: { slug },
      timestamp: now,
    });
    return pageId;
  },
});

export const updateContent = mutation({
  args: {
    pageId: v.id("cmsPages"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    claimIds: v.optional(v.array(v.id("claims"))),
  },
  returns: pageResultValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("PAGE_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      actor._id,
      page.orgId,
      CONTENT_EDITOR_ROLES,
    );
    if (page.status === "published") {
      await requireActiveMembership(
        ctx,
        actor._id,
        page.orgId,
        CONTENT_APPROVER_ROLES,
      );
    }
    const claimIds =
      args.claimIds === undefined
        ? page.claimIds
        : await validateClaims(
            ctx,
            page.orgId,
            args.claimIds,
            page.status === "published",
          );
    if (page.status === "published" && args.claimIds === undefined) {
      await validateClaims(ctx, page.orgId, page.claimIds, true);
    }
    const now = Date.now();
    await ctx.db.patch(page._id, {
      title:
        args.title === undefined
          ? page.title
          : normalized(args.title, "INVALID_PAGE_TITLE", 200),
      content:
        args.content === undefined
          ? page.content
          : normalized(args.content, "INVALID_PAGE_CONTENT", 100_000),
      claimIds,
      updatedBy: actor._id,
      updatedAt: now,
    });
    const updated = await ctx.db.get(page._id);
    if (!updated) throw new Error("PAGE_NOT_FOUND");
    await insertRevision(ctx, updated, actor._id, now);
    await appendAuditEvent(ctx, {
      orgId: page.orgId,
      actorId: actor._id,
      action: "cms.page_content_updated",
      targetResource: page._id,
      timestamp: now,
    });
    return pageResult(updated);
  },
});

export const updateStatus = mutation({
  args: { pageId: v.id("cmsPages"), status: pageStatusValidator },
  returns: pageResultValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("PAGE_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      actor._id,
      page.orgId,
      CONTENT_EDITOR_ROLES,
    );
    if (args.status === "published" || page.status === "published") {
      await requireActiveMembership(
        ctx,
        actor._id,
        page.orgId,
        CONTENT_APPROVER_ROLES,
      );
    }
    if (args.status === "published") {
      await validateClaims(ctx, page.orgId, page.claimIds, true);
    }
    const now = Date.now();
    await ctx.db.patch(page._id, {
      status: args.status,
      updatedBy: actor._id,
      updatedAt: now,
      publishedAt:
        args.status === "published" ? page.publishedAt ?? now : page.publishedAt,
    });
    const updated = await ctx.db.get(page._id);
    if (!updated) throw new Error("PAGE_NOT_FOUND");
    await insertRevision(ctx, updated, actor._id, now);
    await appendAuditEvent(ctx, {
      orgId: page.orgId,
      actorId: actor._id,
      action: "cms.page_status_updated",
      targetResource: page._id,
      metadata: { from: page.status, to: args.status },
      timestamp: now,
    });
    return pageResult(updated);
  },
});
