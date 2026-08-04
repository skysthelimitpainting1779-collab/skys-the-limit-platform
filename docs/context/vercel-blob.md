# Vercel Blob Security Contract — Context7 Research Record

- **Research Date:** 2026-08-03
- **Library ID:** `/vercel/storage`
- **Version:** `@vercel/blob` 2.6.1
- **Decision Affected:** Private document upload, metadata verification, download authorization, and deletion.

## Enforced Contracts

- Blob bytes live only in Vercel Blob; Convex stores authorization state and metadata.
- Upload URLs are short-lived, private, pathname-scoped, MIME-scoped, and size-scoped.
- `head()` supplies authoritative pathname, content type, and size before Convex metadata is registered.
- Download URLs are generated only after Convex resource authorization and expire after five minutes.
- Customer project blobs use a non-public Convex access class; generic anonymous public metadata and download functions cannot mint access to them.
- Blob URLs and pathnames are never returned by public Convex metadata queries.
- Preview and Production use separate Blob stores and server-only read/write tokens.
- `issueSignedToken()` grants only the `get` operation for the authorized pathname, and `presignUrl()` produces the temporary private download URL after Convex authorization succeeds.
- `getDownloadUrl()` only adds a download query parameter; it is applied to the already-presigned URL only after customer authorization and is never treated as the private-Blob security boundary.
