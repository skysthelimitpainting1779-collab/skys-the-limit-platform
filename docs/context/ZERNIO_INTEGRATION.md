# Zernio Integration

## Purpose

Zernio provides the platform's server-side social-account connection, scheduling, and publishing boundary. The integration uses the official `@zernio/node` SDK and does not introduce another database or authentication system.

## Authoritative sources

- Authentication: `https://zernio.com/auth.md`
- Agent quickstart: `https://zernio.com/agent-quickstart.md`
- API reference: `https://zernio.com/llms.txt`
- Official Node SDK: `https://github.com/zernio-dev/zernio-node`

Context7 library ID: `/zernio-dev/zernio-node`.

## Environment contract

`ZERNIO_API_KEY` is a server-only credential. Store it in `.env.local` for local development and in the environment-specific secret store for deployments. Never prefix it with `NEXT_PUBLIC_`, write it to logs, return it from a route, or commit it.

`ENABLE_LIVE_SOCIAL` defaults to `false`. The application refuses post creation unless the flag is explicitly `true`, and environment validation blocks that setting in Development and Preview.

## Modules

- `src/lib/zernio/client.ts` lazily creates one SDK client from `ZERNIO_API_KEY`.
- `src/lib/zernio/service.ts` exposes the narrow supported operations: list profiles, list connected accounts, create hosted OAuth URLs, and create posts behind the live-social gate.
- `scripts/verify-zernio-auth.mjs` performs a read-only credential check by listing profiles and accounts. It never creates or publishes a post.

## Local verification

```bash
cp .env.example .env.local
# Replace only ZERNIO_API_KEY with the authorized value.
# Keep ENABLE_LIVE_SOCIAL=false.
npm run verify:zernio
```

Expected output reports profile and connected-account counts without revealing the credential.

## Publishing safety

A post may be created only when all of the following are true:

1. The call executes on the server.
2. `ZERNIO_API_KEY` is configured with a non-placeholder value.
3. `ENABLE_LIVE_SOCIAL=true` is present in the Production environment.
4. The calling workflow has separately obtained the required human approval for the content, accounts, and schedule.

The integration setup and credential verification must remain read-only.
