# Next.js App Router Context & Contract

- **Research Date**: 2026-07-31
- **Official Source**: Context7 `/vercel/next.js`
- **Selected Version / Contract**: Next.js v15 / App Router with React 19 Server Components
- **Decision Affected**: Route structure (`src/app`), Server Components vs Client Components boundary.
- **Important Constraints**:
  - Keep route handlers explicit under HTTP boundaries.
  - Server components by default for zero client JavaScript bundle bloat.
  - Use `"use client"` only for interactive UI components or hooks.
