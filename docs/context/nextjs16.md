# Next.js 16 App Router Contract — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/vercel/next.js`
- **Version:** Next.js 16.2.12 (Turbopack)
- **Official Source:** https://github.com/vercel/next.js
- **Decision Affected:** Route protection, metadata exports, layout conventions, middleware routing, and static/dynamic rendering.

## Key Contracts & Implementation Patterns

1. **App Router & Turbopack:**
   - Next.js 16 utilizes the App Router paradigm with Turbopack bundler for fast HMR and compilation.
   - Page and layout routes reside in `src/app/`.

2. **Robots Metadata for Preview & Protected Routes:**
   ```typescript
   export const metadata: Metadata = {
     robots: {
       index: false,
       follow: false,
       nocache: true,
     },
   };
   ```

3. **Server Components by Default:**
   - Page routes pre-render on the server. Interactive UI elements (sliders, wizards, dialogs) are isolated into client components with `'use client'`.

4. **Route Handlers (`route.ts`):**
   - Public HTTP API boundaries use App Router Route Handlers.
   - Body parsing via `request.json()`.
   - Return structured `NextResponse.json()` with explicit HTTP status codes.

5. **Middleware & Proxy Conventions:**
   - Use `proxy.ts` for edge request interception when AuthKit is active.
   - Keep public marketing and estimate intake routes available even when auth is unconfigured.
