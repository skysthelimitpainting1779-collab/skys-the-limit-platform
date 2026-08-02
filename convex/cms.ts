import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  CMS_EDITOR_ROLES,
  CMS_PUBLISHER_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";

/**
 * Public Query: Fetch published page by slug with pre-rendered section hierarchy.
 */
export const getPublishedPage = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("cmsPages")
      .withIndex("by_slug_status", (q) =>
        q.eq("slug", args.slug).eq("status", "published"),
      )
      .first();

    if (!page) return null;

    const sections = await ctx.db
      .query("cmsPageSections")
      .withIndex("by_page_status", (q) =>
        q.eq("pageId", page._id).eq("status", "published"),
      )
      .collect();

    sections.sort((a, b) => a.order - b.order);

    return {
      page,
      sections,
    };
  },
});

/** Public Query: Fetch active published services. */
export const getPublishedServices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("services")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
  },
});

/** Public Query: Fetch published projects with verified public assets. */
export const getPublishedProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_publication", (q) =>
        q.eq("publicationStatus", "published"),
      )
      .collect();

    return projects.filter(
      (project) => project.permissionStatus === "public_approved",
    );
  },
});

/** Operations Query: list CMS pages only for active organizations of the user. */
export const listCmsPages = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireAuthenticatedUser(ctx, CMS_EDITOR_ROLES);
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();
    const allowedOrgIds = new Set(
      memberships
        .filter((membership) => membership.status === "active")
        .map((membership) => membership.orgId),
    );

    if (allowedOrgIds.size === 0) throw new Error("FORBIDDEN");

    const pages = await ctx.db.query("cmsPages").collect();
    return pages.filter((page) => allowedOrgIds.has(page.orgId));
  },
});

/**
 * Create or update a CMS draft. Authenticated identity is the author and the
 * page organization must have an active membership for that user.
 */
export const updateCmsPageDraft = mutation({
  args: {
    pageId: v.optional(v.id("cmsPages")),
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    layoutVariant: v.string(),
    seoTitle: v.string(),
    seoDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx, CMS_EDITOR_ROLES);
    const now = Date.now();

    if (args.pageId) {
      const page = await ctx.db.get(args.pageId);
      if (!page) throw new Error("CMS_PAGE_NOT_FOUND");
      await requireActiveMembership(ctx, currentUser._id, page.orgId);

      await ctx.db.patch(args.pageId, {
        title: args.title,
        summary: args.summary,
        layoutVariant: args.layoutVariant,
        seoTitle: args.seoTitle,
        seoDescription: args.seoDescription,
        status: "draft",
        updatedBy: currentUser._id,
        updatedAt: now,
      });

      await ctx.db.insert("auditEvents", {
        actorId: currentUser._id,
        action: "cms_page_draft_updated",
        targetResource: args.pageId,
        timestamp: now,
      });

      return args.pageId;
    }

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();
    const membership = memberships.find(
      (candidate) => candidate.status === "active",
    );
    if (!membership) throw new Error("FORBIDDEN");

    const id = await ctx.db.insert("cmsPages", {
      orgId: membership.orgId,
      slug: args.slug,
      routeType: "public",
      title: args.title,
      summary: args.summary,
      layoutVariant: args.layoutVariant,
      seoTitle: args.seoTitle,
      seoDescription: args.seoDescription,
      canonicalPath: `/${args.slug}`,
      indexable: true,
      status: "draft",
      updatedBy: currentUser._id,
      updatedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorId: currentUser._id,
      action: "cms_page_created",
      targetResource: id,
      timestamp: now,
    });

    return id;
  },
});

/** Publish a CMS page only with an authenticated publisher role. */
export const publishCmsPage = mutation({
  args: {
    pageId: v.id("cmsPages"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(
      ctx,
      CMS_PUBLISHER_ROLES,
    );
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("CMS_PAGE_NOT_FOUND");
    await requireActiveMembership(ctx, currentUser._id, page.orgId);

    const now = Date.now();
    await ctx.db.patch(args.pageId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
      updatedBy: currentUser._id,
    });

    const sections = await ctx.db
      .query("cmsPageSections")
      .withIndex("by_page_order", (q) => q.eq("pageId", args.pageId))
      .collect();

    for (const section of sections) {
      await ctx.db.patch(section._id, { status: "published" });
    }

    await ctx.db.insert("auditEvents", {
      actorId: currentUser._id,
      action: "cms_page_published",
      targetResource: args.pageId,
      timestamp: now,
    });

    return { success: true, publishedAt: now };
  },
});
