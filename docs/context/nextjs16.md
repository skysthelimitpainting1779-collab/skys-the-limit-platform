# Next.js 16 App Router Contract — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/vercel/next.js`
- **Version:** Next.js 16.2.12 (Turbopack)
- **Official Source:** https://github.com/vercel/next.js
- **Decision Affected:** Route protection, metadata exports, layout conventions, and static generation.

## Key Contracts
1. **Robots Metadata for Preview Routes:**
   ```typescript
   export const metadata: Metadata = {
     robots: {
       index: false,
       follow: false,
       nocache: true,
     },
   };
   ```
2. **Server Components by Default:** Page routes pre-render on the server. Interactive UI elements (sliders, wizards, dialogs) are isolated into client components with `'use client'`.
3. **Cookie-Based Sidebar Persistence:** Sidebar open/closed state is persisted via `cookies().get('sidebar:state')`.
