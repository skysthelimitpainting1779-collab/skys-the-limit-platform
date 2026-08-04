"use node";

import {
  del,
  getDownloadUrl as getBlobDownloadUrl,
  head,
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import {
  accessLevelValidator,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "./lib/filePolicy";

const UPLOAD_TTL_MS = 15 * 60 * 1_000;
const DOWNLOAD_TTL_MS = 5 * 60 * 1_000;

function validateUploadRequest(name: string, mimeType: string, fileSize: number) {
  const normalizedName = name.trim();
  if (
    !normalizedName ||
    normalizedName.length > 255 ||
    normalizedName.includes("/") ||
    normalizedName.includes("\\")
  ) {
    throw new Error("INVALID_FILE_NAME");
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType as never)) {
    throw new Error("INVALID_MIME_TYPE");
  }
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) {
    throw new Error("INVALID_FILE_SIZE");
  }
  if (fileSize > MAX_FILE_SIZE_BYTES) throw new Error("FILE_TOO_LARGE");
  return normalizedName;
}

function safePathSegment(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

type AuthorizedBlob = {
  blobUrl: string;
  blobPathname: string;
  name: string;
};

async function createPrivateDownload(document: AuthorizedBlob) {
  const expiresAt = Date.now() + DOWNLOAD_TTL_MS;
  const signedToken = await issueSignedToken({
    pathname: document.blobPathname,
    operations: ["get"],
    validUntil: expiresAt,
  });
  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "get",
    pathname: document.blobPathname,
    access: "private",
    validUntil: expiresAt,
    useCache: false,
  });
  return {
    url: getBlobDownloadUrl(presignedUrl),
    name: document.name,
    expiresAt,
  };
}

export const generateUploadUrl = action({
  args: {
    name: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    orgId: v.id("organizations"),
    accessLevel: accessLevelValidator,
    jobId: v.optional(v.id("jobs")),
  },
  returns: v.object({
    uploadUrl: v.string(),
    pathname: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args): Promise<{
    uploadUrl: string;
    pathname: string;
    expiresAt: number;
  }> => {
    const name = validateUploadRequest(args.name, args.mimeType, args.fileSize);
    const authorization: {
      actorId: Id<"users">;
      pathnamePrefix: string;
    } = await ctx.runQuery(
      internal.files.authorizeDocumentUpload,
      {
        orgId: args.orgId,
        accessLevel: args.accessLevel,
        jobId: args.jobId,
      },
    );
    const expiresAt = Date.now() + UPLOAD_TTL_MS;
    const pathname: string = `${authorization.pathnamePrefix}${globalThis.crypto.randomUUID()}-${safePathSegment(name)}`;
    const signedToken = await issueSignedToken({
      pathname,
      operations: ["put"],
      validUntil: expiresAt,
      allowedContentTypes: [args.mimeType],
      maximumSizeInBytes: args.fileSize,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      operation: "put",
      pathname,
      access: "private",
      validUntil: expiresAt,
      allowedContentTypes: [args.mimeType],
      maximumSizeInBytes: args.fileSize,
      allowOverwrite: false,
      addRandomSuffix: false,
    });
    return { uploadUrl: presignedUrl, pathname, expiresAt };
  },
});
export const finalizeUpload = action({
  args: {
    blobUrl: v.string(),
    name: v.string(),
    orgId: v.id("organizations"),
    accessLevel: accessLevelValidator,
    jobId: v.optional(v.id("jobs")),
  },
  returns: v.id("documents"),
  handler: async (ctx, args): Promise<Id<"documents">> => {
    const authorization: {
      actorId: Id<"users">;
      pathnamePrefix: string;
    } = await ctx.runQuery(
      internal.files.authorizeDocumentUpload,
      {
        orgId: args.orgId,
        accessLevel: args.accessLevel,
        jobId: args.jobId,
      },
    );
    const metadata = await head(args.blobUrl);
    validateUploadRequest(args.name, metadata.contentType, metadata.size);
    if (!metadata.pathname.startsWith(authorization.pathnamePrefix)) {
      throw new Error("INVALID_BLOB_PATH");
    }

    return await ctx.runMutation(internal.files.registerDocument, {
      blobUrl: metadata.url,
      blobPathname: metadata.pathname,
      name: args.name,
      mimeType: metadata.contentType,
      size: metadata.size,
      orgId: args.orgId,
      accessLevel: args.accessLevel,
      jobId: args.jobId,
    });
  },
});

export const getDownloadUrl = action({
  args: { documentId: v.id("documents") },
  returns: v.object({
    url: v.string(),
    name: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args): Promise<{
    url: string;
    name: string;
    expiresAt: number;
  }> => {
    const document: AuthorizedBlob = await ctx.runQuery(
      internal.files.getAuthorizedBlob,
      args,
    );
    return await createPrivateDownload(document);
  },
});

export const getCustomerDownloadUrl = action({
  args: { documentId: v.id("documents") },
  returns: v.object({
    url: v.string(),
    name: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args): Promise<{
    url: string;
    name: string;
    expiresAt: number;
  }> => {
    const document: AuthorizedBlob = await ctx.runQuery(
      internal.files.getCustomerAuthorizedBlob,
      args,
    );
    return await createPrivateDownload(document);
  },
});

export const deleteDocument = action({
  args: { documentId: v.id("documents") },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args): Promise<{ success: true }> => {
    const document: { blobUrl: string } = await ctx.runQuery(
      internal.files.getDeletableBlob,
      args,
    );
    await del(document.blobUrl);
    await ctx.runMutation(internal.files.deleteDocumentMetadata, args);
    return { success: true as const };
  },
});
