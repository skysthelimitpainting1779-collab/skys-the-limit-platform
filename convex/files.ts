import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  CREW_ROLES,
  FILE_PUBLICATION_ROLES,
  OPERATIONS_MANAGER_ROLES,
  OPERATIONS_READ_ROLES,
  requireActiveMembership,
  requireActiveOrganization,
  requireAuthenticatedUser,
  requireCrewAssignment,
} from "./lib/authorization";
import { appendAuditEvent } from "./lib/audit";
import {
  accessLevelValidator,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "./lib/filePolicy";

export { accessLevelValidator, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
const MAX_FILE_NAME_LENGTH = 255;

const documentMetadataValidator = v.object({
  _id: v.id("documents"),
  _creationTime: v.number(),
  name: v.string(),
  mimeType: v.string(),
  size: v.number(),
  accessLevel: accessLevelValidator,
  createdAt: v.number(),
});

type FileContext = QueryCtx | MutationCtx;
type AccessLevel = Doc<"documents">["accessLevel"];

const FILE_INTERNAL_READ_ROLES = [
  ...OPERATIONS_READ_ROLES,
  ...CREW_ROLES,
  "content_editor",
  "content_approver",
] as const;

const FILE_UPLOAD_ROLES = [
  ...OPERATIONS_READ_ROLES,
  ...CREW_ROLES,
  "content_editor",
  "content_approver",
] as const;

const FILE_DELETE_ROLES = ["owner", "admin"] as const;

function publicMetadata(document: Doc<"documents">) {
  return {
    _id: document._id,
    _creationTime: document._creationTime,
    name: document.name,
    mimeType: document.mimeType,
    size: document.size,
    accessLevel: document.accessLevel,
    createdAt: document.createdAt,
  };
}

function validateAuthoritativeMetadata(args: {
  name: string;
  mimeType: string;
  size: number;
}) {
  const name = args.name.trim();
  if (
    !name ||
    name.length > MAX_FILE_NAME_LENGTH ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    throw new Error("INVALID_FILE_NAME");
  }
  if (!ALLOWED_MIME_TYPES.includes(args.mimeType as never)) {
    throw new Error("INVALID_MIME_TYPE");
  }
  if (!Number.isSafeInteger(args.size) || args.size <= 0) {
    throw new Error("INVALID_FILE_SIZE");
  }
  if (args.size > MAX_FILE_SIZE_BYTES) throw new Error("FILE_TOO_LARGE");
  return name;
}

async function loadAuthorizedJob(
  ctx: FileContext,
  orgId: Id<"organizations">,
  jobId: Id<"jobs"> | undefined,
) {
  if (!jobId) return null;
  const job = await ctx.db.get(jobId);
  if (!job || job.orgId !== orgId) throw new Error("FORBIDDEN");
  return job;
}

async function authorizeUpload(
  ctx: FileContext,
  args: {
    orgId: Id<"organizations">;
    accessLevel: AccessLevel;
    jobId?: Id<"jobs">;
  },
) {
  const actor = await requireAuthenticatedUser(ctx);
  const membership = await requireActiveMembership(
    ctx,
    actor._id,
    args.orgId,
    FILE_UPLOAD_ROLES,
  );
  const job = await loadAuthorizedJob(ctx, args.orgId, args.jobId);

  if (
    args.accessLevel === "public" &&
    !FILE_PUBLICATION_ROLES.includes(membership.role)
  ) {
    throw new Error("FORBIDDEN");
  }
  if (CREW_ROLES.includes(membership.role)) {
    if (!job || args.accessLevel !== "restricted") {
      throw new Error("FORBIDDEN");
    }
    requireCrewAssignment(job, actor._id);
  }

  return { actor, membership, job };
}

async function authorizeRead(
  ctx: FileContext,
  document: Doc<"documents">,
) {
  await requireActiveOrganization(ctx, document.orgId);
  if (document.accessLevel === "public") return null;

  const actor = await requireAuthenticatedUser(ctx);
  const membership = await requireActiveMembership(
    ctx,
    actor._id,
    document.orgId,
  );
  if (CREW_ROLES.includes(membership.role)) {
    const job = await loadAuthorizedJob(ctx, document.orgId, document.jobId);
    if (!job) throw new Error("FORBIDDEN");
    requireCrewAssignment(job, actor._id);
  }
  if (document.accessLevel === "restricted") {
    if (
      document.uploadedBy !== actor._id &&
      !OPERATIONS_MANAGER_ROLES.includes(membership.role)
    ) {
      throw new Error("FORBIDDEN");
    }
    return actor;
  }

  if (!FILE_INTERNAL_READ_ROLES.includes(membership.role)) {
    throw new Error("FORBIDDEN");
  }
  return actor;
}

async function authorizeDelete(
  ctx: FileContext,
  document: Doc<"documents">,
) {
  const actor = await requireAuthenticatedUser(ctx);
  await requireActiveMembership(
    ctx,
    actor._id,
    document.orgId,
    FILE_DELETE_ROLES,
  );
  return actor;
}

export const authorizeDocumentUpload = internalQuery({
  args: {
    orgId: v.id("organizations"),
    accessLevel: accessLevelValidator,
    jobId: v.optional(v.id("jobs")),
  },
  returns: v.object({
    actorId: v.id("users"),
    pathnamePrefix: v.string(),
  }),
  handler: async (ctx, args) => {
    const { actor } = await authorizeUpload(ctx, args);
    return {
      actorId: actor._id,
      pathnamePrefix: `organizations/${args.orgId}/users/${actor._id}/`,
    };
  },
});

export const registerDocument = internalMutation({
  args: {
    blobUrl: v.string(),
    blobPathname: v.string(),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    orgId: v.id("organizations"),
    accessLevel: accessLevelValidator,
    jobId: v.optional(v.id("jobs")),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    const name = validateAuthoritativeMetadata(args);
    const { actor } = await authorizeUpload(ctx, args);
    const pathnamePrefix = `organizations/${args.orgId}/users/${actor._id}/`;
    if (!args.blobPathname.startsWith(pathnamePrefix)) {
      throw new Error("INVALID_BLOB_PATH");
    }

    const existing = await ctx.db
      .query("documents")
      .withIndex("by_blob_url", (index) => index.eq("blobUrl", args.blobUrl))
      .unique();
    if (existing) throw new Error("DOCUMENT_ALREADY_REGISTERED");

    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      blobUrl: args.blobUrl,
      blobPathname: args.blobPathname,
      name,
      mimeType: args.mimeType,
      size: args.size,
      orgId: args.orgId,
      uploadedBy: actor._id,
      accessLevel: args.accessLevel,
      jobId: args.jobId,
      createdAt: now,
    });
    await appendAuditEvent(ctx, {
      orgId: args.orgId,
      actorId: actor._id,
      action: "document.registered",
      targetResource: documentId,
      metadata: {
        jobId: args.jobId,
        accessLevel: args.accessLevel,
        blobPathname: args.blobPathname,
      },
      timestamp: now,
    });
    return documentId;
  },
});

export const getAuthorizedBlob = internalQuery({
  args: { documentId: v.id("documents") },
  returns: v.object({
    blobUrl: v.string(),
    blobPathname: v.string(),
    name: v.string(),
  }),
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("DOCUMENT_NOT_FOUND");
    await authorizeRead(ctx, document);
    return {
      blobUrl: document.blobUrl,
      blobPathname: document.blobPathname,
      name: document.name,
    };
  },
});

export const getDeletableBlob = internalQuery({
  args: { documentId: v.id("documents") },
  returns: v.object({ blobUrl: v.string() }),
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("DOCUMENT_NOT_FOUND");
    await authorizeDelete(ctx, document);
    return { blobUrl: document.blobUrl };
  },
});

export const deleteDocumentMetadata = internalMutation({
  args: { documentId: v.id("documents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) return null;
    const actor = await authorizeDelete(ctx, document);
    await ctx.db.delete(document._id);
    await appendAuditEvent(ctx, {
      orgId: document.orgId,
      actorId: actor._id,
      action: "document.metadata_deleted",
      targetResource: document._id,
      metadata: {
        jobId: document.jobId,
        accessLevel: document.accessLevel,
        blobPathname: document.blobPathname,
      },
    });
    return null;
  },
});

export const getDocument = query({
  args: { documentId: v.id("documents") },
  returns: documentMetadataValidator,
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("DOCUMENT_NOT_FOUND");
    await authorizeRead(ctx, document);
    return publicMetadata(document);
  },
});

export const listDocuments = query({
  args: {
    orgId: v.id("organizations"),
    accessLevel: accessLevelValidator,
    jobId: v.optional(v.id("jobs")),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(documentMetadataValidator),
  handler: async (ctx, args) => {
    await requireActiveOrganization(ctx, args.orgId);
    let actorId: Id<"users"> | undefined;
    let membershipRole: Doc<"memberships">["role"] | undefined;

    if (args.accessLevel !== "public") {
      const actor = await requireAuthenticatedUser(ctx);
      const membership = await requireActiveMembership(
        ctx,
        actor._id,
        args.orgId,
      );
      actorId = actor._id;
      membershipRole = membership.role;

      if (
        args.accessLevel === "internal" &&
        !FILE_INTERNAL_READ_ROLES.includes(membership.role)
      ) {
        throw new Error("FORBIDDEN");
      }
      if (CREW_ROLES.includes(membership.role)) {
        const job = await loadAuthorizedJob(ctx, args.orgId, args.jobId);
        if (!job) throw new Error("FORBIDDEN");
        requireCrewAssignment(job, actor._id);
      }
    }

    const managersCanReadRestricted =
      membershipRole !== undefined &&
      OPERATIONS_MANAGER_ROLES.includes(membershipRole);
    const restrictToUploader =
      args.accessLevel === "restricted" && !managersCanReadRestricted;

    let result;
    if (restrictToUploader) {
      if (!actorId) throw new Error("UNAUTHENTICATED");
      result = args.jobId
        ? await ctx.db
            .query("documents")
            .withIndex(
              "by_org_and_access_level_and_uploader_and_job",
              (index) =>
                index
                  .eq("orgId", args.orgId)
                  .eq("accessLevel", args.accessLevel)
                  .eq("uploadedBy", actorId)
                  .eq("jobId", args.jobId),
            )
            .order("desc")
            .paginate(args.paginationOpts)
        : await ctx.db
            .query("documents")
            .withIndex("by_org_and_access_level_and_uploader", (index) =>
              index
                .eq("orgId", args.orgId)
                .eq("accessLevel", args.accessLevel)
                .eq("uploadedBy", actorId),
            )
            .order("desc")
            .paginate(args.paginationOpts);
    } else {
      result = args.jobId
        ? await ctx.db
            .query("documents")
            .withIndex("by_org_and_access_level_and_job", (index) =>
              index
                .eq("orgId", args.orgId)
                .eq("accessLevel", args.accessLevel)
                .eq("jobId", args.jobId),
            )
            .order("desc")
            .paginate(args.paginationOpts)
        : await ctx.db
            .query("documents")
            .withIndex("by_org_and_access_level", (index) =>
              index
                .eq("orgId", args.orgId)
                .eq("accessLevel", args.accessLevel),
            )
            .order("desc")
            .paginate(args.paginationOpts);
    }

    return { ...result, page: result.page.map(publicMetadata) };
  },
});
