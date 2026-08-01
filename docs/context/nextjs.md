# Next.js App Router implementation contract

- Research date: 2026-08-01
- Official Context7 library: `/vercel/next.js/v16.2.9`
- Installed package: Next.js `16.2.12`
- Decision: use App Router Route Handlers for explicit public HTTP boundaries.

## Applied constraints

- Parse JSON with `request.json()` inside the Route Handler.
- Read optional runtime provider environment variables inside request execution, never during module initialization.
- Return structured JSON and explicit status codes.
- Use `proxy.ts`, not the deprecated `middleware.ts` convention, when AuthKit is activated.
- Keep the marketing and estimate pages available when optional authentication is not configured.
