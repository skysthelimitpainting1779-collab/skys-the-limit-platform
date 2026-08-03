/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

const blobMocks = vi.hoisted(() => ({
  del: vi.fn(),
  head: vi.fn(),
  issueSignedToken: vi.fn(),
  presignUrl: vi.fn(),
}));

vi.mock("@vercel/blob", () => blobMocks);

import * as fileActions from "../../convex/fileActions";

function getHandler(fn: any) {
  return fn._handler || fn;
}

const orgId = "organizations_org" as any;
const jobId = "jobs_job" as any;
const documentId = "documents_document" as any;
const prefix = `organizations/${orgId}/users/users_actor/`;

describe("Vercel Blob action boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    blobMocks.issueSignedToken.mockResolvedValue({
      clientSigningToken: "client-token",
      delegationToken: "delegation-token",
      validUntil: Date.now() + 60_000,
    });
    blobMocks.presignUrl.mockResolvedValue({
      presignedUrl: "https://blob.example/presigned",
    });
  });

  it("scopes upload URLs to the authorized path, MIME, size, and private access", async () => {
    const runQuery = vi.fn().mockResolvedValue({
      actorId: "users_actor",
      pathnamePrefix: prefix,
    });
    const handler = getHandler(fileActions.generateUploadUrl);

    const result = await handler(
      { runQuery },
      {
        name: "proposal.pdf",
        mimeType: "application/pdf",
        fileSize: 1_024,
        orgId,
        accessLevel: "restricted",
        jobId,
      },
    );

    expect(result.pathname).toMatch(
      /^organizations\/organizations_org\/users\/users_actor\/[\w-]+-proposal\.pdf$/,
    );
    expect(blobMocks.issueSignedToken).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: result.pathname,
        operations: ["put"],
        allowedContentTypes: ["application/pdf"],
        maximumSizeInBytes: 1_024,
      }),
    );
    expect(blobMocks.presignUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        operation: "put",
        access: "private",
        pathname: result.pathname,
        allowOverwrite: false,
      }),
    );
  });

  it("registers only authoritative head metadata", async () => {
    const runQuery = vi.fn().mockResolvedValue({
      actorId: "users_actor",
      pathnamePrefix: prefix,
    });
    const runMutation = vi.fn().mockResolvedValue(documentId);
    blobMocks.head.mockResolvedValue({
      url: "https://blob.example/canonical",
      pathname: `${prefix}uuid-proposal.pdf`,
      contentType: "application/pdf",
      size: 2_048,
    });
    const handler = getHandler(fileActions.finalizeUpload);

    await expect(
      handler(
        { runQuery, runMutation },
        {
          blobUrl: "https://blob.example/requested",
          name: "proposal.pdf",
          orgId,
          accessLevel: "restricted",
          jobId,
        },
      ),
    ).resolves.toBe(documentId);
    expect(runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        blobUrl: "https://blob.example/canonical",
        blobPathname: `${prefix}uuid-proposal.pdf`,
        mimeType: "application/pdf",
        size: 2_048,
      }),
    );
  });

  it("rejects oversized or foreign-path blobs before metadata insertion", async () => {
    const runQuery = vi.fn().mockResolvedValue({
      actorId: "users_actor",
      pathnamePrefix: prefix,
    });
    const runMutation = vi.fn();
    const handler = getHandler(fileActions.finalizeUpload);

    blobMocks.head.mockResolvedValueOnce({
      url: "https://blob.example/oversized",
      pathname: `${prefix}oversized.pdf`,
      contentType: "application/pdf",
      size: 25 * 1024 * 1024 + 1,
    });
    await expect(
      handler(
        { runQuery, runMutation },
        {
          blobUrl: "https://blob.example/oversized",
          name: "oversized.pdf",
          orgId,
          accessLevel: "restricted",
          jobId,
        },
      ),
    ).rejects.toThrow("FILE_TOO_LARGE");

    blobMocks.head.mockResolvedValueOnce({
      url: "https://blob.example/foreign",
      pathname: "organizations/other/users/attacker/file.pdf",
      contentType: "application/pdf",
      size: 100,
    });
    await expect(
      handler(
        { runQuery, runMutation },
        {
          blobUrl: "https://blob.example/foreign",
          name: "file.pdf",
          orgId,
          accessLevel: "restricted",
          jobId,
        },
      ),
    ).rejects.toThrow("INVALID_BLOB_PATH");
    expect(runMutation).not.toHaveBeenCalled();
  });
});
