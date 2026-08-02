import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

/**
 * Public Query: Fetch active published services.
 */
export const getPublishedServices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("services")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
  },
});

/**
 * Public Query: Fetch published projects with verified public assets.
 */
export const getPublishedProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_publication", (q) => q.eq("publicationStatus", "published"))
      .collect();

    // Verify all attached assets are public_approved
    const safeProjects = [];
    for (const proj of projects) {
      if (proj.permissionStatus === "public_approved") {
        safeProjects.push(proj);
      }
    }
    return safeProjects;
  },
});

/**
 * Operations Query: List all CMS pages regardless of status.
 */
export const listCmsPages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cmsPages").collect();
  },
});

/**
 * Operations Mutation: Create or update CMS page draft.
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
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.pageId) {
      await ctx.db.patch(args.pageId, {
        title: args.title,
        summary: args.summary,
        layoutVariant: args.layoutVariant,
        seoTitle: args.seoTitle,
        seoDescription: args.seoDescription,
        status: "draft",
        updatedBy: args.authorId,
        updatedAt: now,
      });

      await ctx.db.insert("auditEvents", {
        actorId: args.authorId,
        action: "cms_page_draft_updated",
        targetResource: args.pageId,
        timestamp: now,
      });

      return args.pageId;
    }

    const org = await ctx.db.query("organizations").first();
    if (!org) throw new Error("No organization found");

    const id = await ctx.db.insert("cmsPages", {
      orgId: org._id,
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
      updatedBy: args.authorId,
      updatedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      actorId: args.authorId,
      action: "cms_page_created",
      targetResource: id,
      timestamp: now,
    });

    return id;
  },
});

/**
 * Operations Mutation: Publish a CMS page.
 */
export const publishCmsPage = mutation({
  args: {
    pageId: v.id("cmsPages"),
    approverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.approverId);
    if (!user || (user.role !== "content_approver" && user.role !== "owner" && user.role !== "admin")) {
      throw new Error("Unauthorized to publish CMS content");
    }

    const now = Date.now();
    await ctx.db.patch(args.pageId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
      updatedBy: args.approverId,
    });

    // Also update attached page sections
    const sections = await ctx.db
      .query("cmsPageSections")
      .withIndex("by_page_order", (q) => q.eq("pageId", args.pageId))
      .collect();

    for (const sec of sections) {
      await ctx.db.patch(sec._id, { status: "published" });
    }

    await ctx.db.insert("auditEvents", {
      actorId: args.approverId,
      action: "cms_page_published",
      targetResource: args.pageId,
      timestamp: now,
    });

    return { success: true, publishedAt: now };
  },
});
