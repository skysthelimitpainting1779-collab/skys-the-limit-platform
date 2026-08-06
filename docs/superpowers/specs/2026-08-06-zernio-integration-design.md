# Zernio Integration Design

Date: 2026-08-06
Status: Implemented on `feature/zernio-integration`; pending verification and independent review
Target: `dev`

## Goal

Integrate Zernio into the Next.js platform using its official Node SDK while preventing credential exposure and accidental live social publishing.

## Scope

The first increment supports:

- API-key authentication through a server-only environment variable
- read-only profile and connected-account discovery
- hosted OAuth connection URLs
- post creation through the official `posts.createPost` method
- a fail-closed production-effect gate
- read-only credential verification

It does not add UI, connect a social account, send a post, deploy Production configuration, or create another persistence layer.

## Architecture

```text
Server action / workflow / route
            |
            v
src/lib/zernio/service.ts
  - list profiles
  - list accounts
  - create OAuth URL
  - create post (gated)
            |
            v
src/lib/zernio/client.ts
  - server-only module
  - lazy singleton
  - ZERNIO_API_KEY
            |
            v
Official @zernio/node SDK
```

The SDK client remains a singleton because the current SDK configures shared generated-client interceptors during construction. Reusing one instance avoids repeated interceptor registration.

## Security invariants

1. `ZERNIO_API_KEY` never enters client bundles and is never logged.
2. Real credentials are stored only in `.env.local` or deployment secret stores.
3. `ENABLE_LIVE_SOCIAL` defaults to `false`.
4. Development and Preview reject `ENABLE_LIVE_SOCIAL=true`.
5. Credential verification calls only profile and account listing APIs.
6. Setup sends no social post and connects no account.

## Data flow

Read operation:

```text
caller -> service -> lazy SDK client -> Zernio API -> typed response -> caller
```

Publish operation:

```text
caller -> service -> check ENABLE_LIVE_SOCIAL
                      | false -> throw; no API call
                      | true  -> posts.createPost -> Zernio API
```

## Error handling

- Missing API key fails immediately with a configuration error.
- Placeholder credentials fail environment validation.
- Live posting without the feature flag fails before invoking the SDK.
- SDK authentication and API errors propagate to the server caller for contextual handling; secrets are not included in application-authored messages.

## Test strategy

The RED test first imported a nonexistent service boundary and CI failed with `TS2307`. The GREEN implementation must prove:

- exact profile namespace delegation
- exact account filter request shape
- exact hosted OAuth request shape
- blocked publishing does not call `posts.createPost`
- approved publishing passes the body unchanged
- placeholder and missing credentials fail closed
- live-social enablement is rejected outside Production

Repository verification remains `npm run verify`, plus `npm run verify:zernio` when an authorized credential is available.

## Rollback

Before merge, delete the feature branch or close PR #31. After merge to `dev`, revert the merge commit. No database migration, production data, social connection, or external post requires rollback.
