# Zod Validation Schema — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/colinhacks/zod`
- **Version:** Zod 3.23.x
- **Official Source:** https://zod.dev
- **Decision Affected:** Form payload validation, API request parsing, and environment variable schema enforcement.

## Key Contracts & Implementation Patterns

1. **Schema-First Type Safety:**
   - Define input validation schemas using Zod primitives and export inferred TypeScript types via `z.infer<typeof schema>`.

2. **Form Integration:**
   - Pair Zod schemas with React Hook Form using `@hookform/resolvers/zod` for client-side and server-side form validation.

3. **API & Request Payload Sanitization:**
   - Route handlers parse and sanitize incoming JSON body payloads using `schema.safeParse(data)` before passing inputs to backend logic.

4. **Environment Schema Enforcement:**
   - Validate environment variables at application startup (`env.ts` / `env.mjs`) to fail fast on missing or malformed configuration keys.

5. **Custom Refinements & Errors:**
   - Utilize `.refine()` for domain-specific cross-field validations (e.g., matching passwords, valid estimate date ranges).
